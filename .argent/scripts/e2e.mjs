#!/usr/bin/env node
// e2e.mjs - start the "E2E (Argent Cloud)" workflow for the current branch,
// follow it, and (with --update-baselines) apply the new baselines locally.
//
//   yarn e2e                                    every suite
//   yarn e2e .argent/e2e/enrichedInput/x.yaml   these tests (files or directories)
//   yarn e2e --update-baselines [tests...]      record baselines, then apply them here
//
// Options (same names and defaults as the workflow inputs):
//   --tests "<paths>"         tests, space separated (or pass them as arguments)
//   --update-baselines        write baselines instead of comparing them
//   --max-wait-minutes <n>    how long the run waits for a free machine (default 30)
// Other options:
//   --ref <branch>            run another pushed branch instead of the current one
//   --no-watch                start the run and exit
//
// Needs the GitHub CLI, logged in (gh auth login), and the branch pushed:
// the workflow runs what is on GitHub, not your working tree.

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../..');
const WORKFLOW = 'e2e-argent.yml';
const BASELINES_PREFIX = 'argent-baselines--';

const tty = process.stdout.isTTY;
const c = {
  dim: (s) => (tty ? `\x1b[2m${s}\x1b[0m` : s),
  bold: (s) => (tty ? `\x1b[1m${s}\x1b[0m` : s),
  red: (s) => (tty ? `\x1b[31m${s}\x1b[0m` : s),
  yellow: (s) => (tty ? `\x1b[33m${s}\x1b[0m` : s),
  green: (s) => (tty ? `\x1b[32m${s}\x1b[0m` : s),
};

function fail(message) {
  console.error(c.red(`Error: ${message}`));
  process.exit(1);
}
const warn = (message) => console.error(c.yellow(`Warning: ${message}`));

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();
}
function tryRun(cmd, args) {
  try {
    return run(cmd, args);
  } catch {
    return null;
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- arguments ----------------------------------------------------------------

function parseArgs(argv) {
  const opts = { tests: [], updateBaselines: false, maxWait: 30, ref: null, watch: true };
  const value = (i, name) => argv[i + 1] ?? fail(`${name} needs a value`);
  for (let i = 0; i < argv.length; i++) {
    let a = argv[i];
    let inline = null;
    if (a.startsWith('--') && a.includes('=')) [a, inline] = [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)];
    const take = () => (inline !== null ? inline : value(i++, a));
    switch (a) {
      case '--update-baselines':
        opts.updateBaselines = inline === null ? true : inline === 'true';
        break;
      case '--tests':
        opts.tests.push(...take().split(/\s+/).filter(Boolean));
        break;
      case '--max-wait-minutes':
        opts.maxWait = Number(take());
        if (!Number.isInteger(opts.maxWait) || opts.maxWait < 0) fail('--max-wait-minutes must be a whole number of minutes');
        break;
      case '--ref':
        opts.ref = take();
        break;
      case '--no-watch':
        opts.watch = false;
        break;
      case '-h':
      case '--help':
        console.log(
          fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1).filter((l, i, all) => all.slice(0, i + 1).every((x) => x.startsWith('//'))).map((l) => l.replace(/^\/\/ ?/, '')).join('\n')
        );
        process.exit(0);
      default:
        if (a.startsWith('-')) fail(`unknown option ${a}`);
        opts.tests.push(a);
    }
  }
  return opts;
}

// Test paths are given relative to where you ran yarn; the workflow wants them
// relative to the repo root.
function normalizeTests(tests) {
  const base = process.env.INIT_CWD || process.cwd();
  return tests.map((t) => {
    const abs = path.resolve(base, t);
    const rel = path.relative(REPO_ROOT, abs).split(path.sep).join('/');
    if (rel.startsWith('..') || path.isAbsolute(rel)) fail(`${t} is outside the repository`);
    if (!fs.existsSync(abs)) fail(`${t} does not exist`);
    if (!rel.startsWith('.argent/e2e/')) fail(`${t} is not under .argent/e2e/`);
    if (/\s/.test(rel)) fail(`${t}: test paths cannot contain spaces`);
    return rel;
  });
}

// --- preflight ------------------------------------------------------------------

function preflight(opts) {
  if (!tryRun('gh', ['--version'])) fail('the GitHub CLI (gh) is not installed: https://cli.github.com');
  if (tryRun('gh', ['auth', 'status']) === null) fail('the GitHub CLI is not logged in: run gh auth login');

  const repo = tryRun('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']);
  if (!repo) fail('could not tell which GitHub repository this is (try gh repo set-default)');
  const login = tryRun('gh', ['api', 'user', '-q', '.login']);

  const current = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  const ref = opts.ref ?? current;
  if (ref === 'HEAD') fail('you are not on a branch: check one out or pass --ref <branch>');

  const remoteSha = tryRun('gh', ['api', `repos/${repo}/branches/${encodeURIComponent(ref)}`, '-q', '.commit.sha']);
  if (!remoteSha) fail(`branch ${ref} is not on GitHub (${repo}). Push it first: git push -u origin ${ref}`);

  if (ref === current) {
    const head = run('git', ['rev-parse', 'HEAD']);
    if (head !== remoteSha) {
      fail(
        `GitHub's ${ref} is at ${remoteSha.slice(0, 9)}, your HEAD is at ${head.slice(0, 9)}.\n` +
          'The workflow runs what is on GitHub: push (or pull) first.'
      );
    }
    if (run('git', ['status', '--porcelain'])) warn('you have uncommitted changes; the run will not include them.');
  }
  return { repo, login, ref, sha: remoteSha };
}

// --- the run ------------------------------------------------------------------

async function findRun({ repo, login, ref }, since, dispatchOutput) {
  const fromOutput = /\/actions\/runs\/(\d+)/.exec(dispatchOutput);
  if (fromOutput) return fromOutput[1];
  const args = ['run', 'list', '-R', repo, '--workflow', WORKFLOW, '--branch', ref, '--event', 'workflow_dispatch', '--limit', '10', '--json', 'databaseId,createdAt'];
  if (login) args.push('--user', login);
  for (let i = 0; i < 30; i++) {
    const runs = JSON.parse(tryRun('gh', args) || '[]');
    // A little slack for clock skew between this computer and GitHub.
    const mine = runs.filter((r) => Date.parse(r.createdAt) >= since - 15_000).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    if (mine.length) return String(mine[0].databaseId);
    await sleep(3000);
  }
  return null;
}

function confirm(question) {
  if (!process.stdin.isTTY) return false;
  process.stdout.write(`${question} [y/N] `);
  const buf = Buffer.alloc(16);
  const n = fs.readSync(0, buf, 0, 16, null);
  return /^y/i.test(buf.subarray(0, n).toString());
}

function applyBaselines(repo, runId, conclusion) {
  const names = (tryRun('gh', ['api', `repos/${repo}/actions/runs/${runId}/artifacts`, '-q', '.artifacts[].name']) || '')
    .split('\n')
    .filter((n) => n.startsWith(BASELINES_PREFIX));
  if (names.length === 0) {
    console.log('The run uploaded no baselines artifact, so there is nothing to apply.');
    return 0;
  }
  const name = names.sort().at(-1);
  if (conclusion !== 'success' && !confirm(`The run did not pass (${conclusion}), but it uploaded ${name}. Apply it anyway?`)) {
    console.log(`Not applied. Get it later with: gh run download ${runId} -R ${repo} -n ${name}`);
    return 1;
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'argent-e2e-'));
  try {
    const dir = path.join(tmp, name);
    console.log(`\nDownloading ${c.bold(name)}...`);
    const dl = spawnSync('gh', ['run', 'download', runId, '-R', repo, '-n', name, '-D', dir], { stdio: 'inherit' });
    if (dl.status !== 0) fail('downloading the baselines failed');
    const apply = spawnSync(process.execPath, [path.join(SCRIPT_DIR, 'update-baselines.mjs'), dir], { cwd: REPO_ROOT, stdio: 'inherit' });
    return apply.status ?? 1;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const tests = normalizeTests(opts.tests);
  const ctx = preflight(opts);

  const inputs = {
    tests: tests.join(' '),
    'update-baselines': String(opts.updateBaselines),
    'max-wait-minutes': String(opts.maxWait),
  };
  console.log(`Starting ${c.bold('E2E (Argent Cloud)')} on ${c.bold(ctx.ref)} (${ctx.sha.slice(0, 9)})`);
  console.log(c.dim(`  tests: ${inputs.tests || 'every suite'}, update-baselines: ${inputs['update-baselines']}, max-wait-minutes: ${inputs['max-wait-minutes']}`));

  const since = Date.now();
  const dispatchArgs = ['workflow', 'run', WORKFLOW, '-R', ctx.repo, '--ref', ctx.ref];
  for (const [k, v] of Object.entries(inputs)) dispatchArgs.push('-f', `${k}=${v}`);
  let dispatchOutput;
  try {
    dispatchOutput = run('gh', dispatchArgs);
  } catch (err) {
    fail(`could not start the workflow: ${(err.stderr || err.message).trim()}`);
  }

  const runId = await findRun(ctx, since, dispatchOutput);
  if (!runId) {
    console.log(`Started, but the run did not show up yet. See https://github.com/${ctx.repo}/actions/workflows/${WORKFLOW}`);
    return 0;
  }
  const url = `https://github.com/${ctx.repo}/actions/runs/${runId}`;
  console.log(`Run: ${url}`);
  if (!opts.watch) return 0;

  process.on('SIGINT', () => {}); // let gh run watch handle Ctrl-C, then say what happened
  spawnSync('gh', ['run', 'watch', runId, '-R', ctx.repo, '--interval', '10'], { stdio: 'inherit' });

  const state = JSON.parse(tryRun('gh', ['run', 'view', runId, '-R', ctx.repo, '--json', 'status,conclusion']) || '{}');
  if (state.status !== 'completed') {
    console.log(`\nStopped following. The run keeps going: ${url}\nCancel it with: gh run cancel ${runId} -R ${ctx.repo}`);
    return 130;
  }
  const conclusion = state.conclusion || 'unknown';
  console.log(conclusion === 'success' ? c.green(`\nThe run passed: ${url}`) : c.red(`\nThe run finished with "${conclusion}": ${url}`));
  if (conclusion !== 'success' && !opts.updateBaselines) {
    console.log(c.dim(`Failure screenshots and diffs: gh run download ${runId} -R ${ctx.repo} -n argent-e2e-artifacts`));
  }

  if (opts.updateBaselines) return applyBaselines(ctx.repo, runId, conclusion) || (conclusion === 'success' ? 0 : 1);
  return conclusion === 'success' ? 0 : 1;
}

main().then((code) => process.exit(code ?? 0));

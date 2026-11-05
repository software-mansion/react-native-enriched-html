#!/usr/bin/env node
// update-baselines.mjs - apply snapshot baselines downloaded from the
// "E2E (Argent Cloud)" workflow to this checkout.
//
//   yarn e2e:update-baselines              pick from the artifacts in ~/Downloads
//   yarn e2e:update-baselines --dir <dir>  look in another directory
//   yarn e2e:update-baselines <file.zip>   apply this artifact
//
// The workflow names each baselines artifact
//   argent-baselines--<YYYYMMDD-HHMMSS>Z--<branch>--run<N>
// GitHub serves it as <name>.zip with argent-baselines.tgz inside. Browsers
// that unpack downloads (Safari) and `gh run download` leave a <name>/
// directory instead; both forms are found.
//
// The chosen artifact is copied and unpacked in a temporary directory, its
// baselines replace or add to the ones under .argent/e2e/, and the temporary
// files are removed. Once applied, the artifact itself is deleted: it holds
// nothing but these baselines, and the run page has it for 14 days.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TGZ_NAME = 'argent-baselines.tgz';
// Browsers add " (1)" to a repeated download.
const NAME_RE = /^argent-baselines--(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})Z--(.+)--run(\d+)(?: \(\d+\))?(\.zip)?$/;

const c = process.stdout.isTTY
  ? { dim: (s) => `\x1b[2m${s}\x1b[0m`, bold: (s) => `\x1b[1m${s}\x1b[0m`, cyan: (s) => `\x1b[36m${s}\x1b[0m`, green: (s) => `\x1b[32m${s}\x1b[0m`, red: (s) => `\x1b[31m${s}\x1b[0m` }
  : { dim: (s) => s, bold: (s) => s, cyan: (s) => s, green: (s) => s, red: (s) => s };

function fail(message) {
  console.error(c.red(`Error: ${message}`));
  process.exit(1);
}

// --- arguments ----------------------------------------------------------------

function parseArgs(argv) {
  const opts = { dir: path.join(os.homedir(), 'Downloads'), file: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir') opts.dir = argv[++i] ?? fail('--dir needs a path');
    else if (a === '-h' || a === '--help') {
      console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 19).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
      process.exit(0);
    } else if (a.startsWith('-')) fail(`unknown option ${a}`);
    else opts.file = a;
  }
  return opts;
}

// --- finding artifacts ----------------------------------------------------------

function describe(fullPath) {
  const base = path.basename(fullPath);
  const m = NAME_RE.exec(base);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, branch, run, zip] = m;
  let stat;
  try {
    stat = fs.statSync(fullPath);
  } catch {
    return null;
  }
  let kind;
  if (stat.isFile() && zip) kind = 'zip';
  else if (stat.isDirectory() && !zip && fs.existsSync(path.join(fullPath, TGZ_NAME))) kind = 'dir';
  else return null;
  const size = kind === 'zip' ? stat.size : fs.statSync(path.join(fullPath, TGZ_NAME)).size;
  return {
    path: fullPath,
    base,
    kind,
    date: new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)),
    branch,
    run: Number(run),
    size,
    mtime: stat.mtimeMs,
  };
}

function scan(dir) {
  let names;
  try {
    names = fs.readdirSync(dir);
  } catch (err) {
    fail(`cannot read ${dir}: ${err.message}`);
  }
  return names
    .filter((n) => n.startsWith('argent-baselines--'))
    .map((n) => describe(path.join(dir, n)))
    .filter(Boolean)
    .sort((a, b) => b.date - a.date || b.run - a.run || b.mtime - a.mtime);
}

// --- interactive list ---------------------------------------------------------

function formatDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const off = -date.getTimezoneOffset();
  const zone = `${off >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} (${zone})`;
}

function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function label(a, i, total) {
  const runCol = `run #${a.run}`.padEnd(9);
  const extra = [a.kind === 'dir' ? 'unpacked' : null, i === 0 && total > 1 ? 'newest' : null].filter(Boolean).join(', ');
  return `${formatDate(a.date)}  ${runCol} ${formatSize(a.size).padStart(8)}  ${a.branch}${extra ? c.dim(`  (${extra})`) : ''}`;
}

function choose(artifacts) {
  return new Promise((resolve) => {
    let index = 0;
    const lines = artifacts.length + 1;
    const out = process.stdout;
    const render = (first) => {
      if (!first) out.write(`\x1b[${lines}A`);
      artifacts.forEach((a, i) => {
        const text = label(a, i, artifacts.length);
        out.write(`\x1b[2K${i === index ? c.cyan(`❯ ${text}`) : `  ${text}`}\n`);
      });
      out.write(`\x1b[2K${c.dim('↑/↓ to move, Enter to apply, q to quit')}\n`);
    };
    const finish = (value) => {
      process.stdin.off('keypress', onKey);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      out.write('\x1b[?25h');
      resolve(value);
    };
    const onKey = (_str, key = {}) => {
      if (key.ctrl && key.name === 'c') return finish(null);
      switch (key.name) {
        case 'up':
        case 'k':
          index = (index - 1 + artifacts.length) % artifacts.length;
          return render(false);
        case 'down':
        case 'j':
          index = (index + 1) % artifacts.length;
          return render(false);
        case 'return':
        case 'enter':
          return finish(artifacts[index]);
        case 'q':
        case 'escape':
          return finish(null);
      }
    };
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('keypress', onKey);
    out.write('\x1b[?25l');
    render(true);
  });
}

// --- applying -----------------------------------------------------------------

// Only files under .argent/e2e/**/__baselines__/ are accepted.
function checkEntry(entry) {
  const rel = entry.replace(/^\.\//, '');
  const parts = rel.split('/');
  const ok =
    !path.isAbsolute(rel) &&
    !parts.includes('..') &&
    rel.startsWith('.argent/e2e/') &&
    parts.includes('__baselines__') &&
    parts.indexOf('__baselines__') < parts.length - 1;
  return ok ? rel : null;
}

function unzip(zipPath, dest) {
  try {
    execFileSync('unzip', ['-q', '-o', zipPath, '-d', dest], { stdio: 'pipe' });
  } catch (err) {
    if (err.code !== 'ENOENT') throw new Error(`could not unzip ${path.basename(zipPath)}: ${err.stderr || err.message}`);
    // No unzip binary: bsdtar (macOS tar) reads zip files too.
    execFileSync('tar', ['-xf', zipPath, '-C', dest], { stdio: 'pipe' });
  }
}

function apply(artifact) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'argent-baselines-'));
  const cleanup = () => fs.rmSync(tmp, { recursive: true, force: true });
  const onSignal = () => {
    cleanup();
    process.exit(130);
  };
  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);
  try {
    // 1. Copy the download, so the original stays untouched.
    let tgz = path.join(tmp, TGZ_NAME);
    if (artifact.kind === 'zip') {
      const zipCopy = path.join(tmp, 'artifact.zip');
      fs.copyFileSync(artifact.path, zipCopy);
      const unzipped = path.join(tmp, 'unzipped');
      fs.mkdirSync(unzipped);
      unzip(zipCopy, unzipped);
      tgz = path.join(unzipped, TGZ_NAME);
      if (!fs.existsSync(tgz)) throw new Error(`${artifact.base} has no ${TGZ_NAME} inside`);
    } else {
      fs.copyFileSync(path.join(artifact.path, TGZ_NAME), tgz);
    }

    // 2. Check every entry before anything is written.
    const entries = execFileSync('tar', ['-tzf', tgz], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
      .split('\n')
      .filter((e) => e && !e.endsWith('/'));
    if (entries.length === 0) throw new Error(`${TGZ_NAME} is empty`);
    const rejected = entries.filter((e) => !checkEntry(e));
    if (rejected.length) {
      throw new Error(`the archive has files outside .argent/e2e/**/__baselines__/, nothing was changed:\n  ${rejected.join('\n  ')}`);
    }

    // 3. Unpack, then copy into the checkout.
    const extracted = path.join(tmp, 'extracted');
    fs.mkdirSync(extracted);
    execFileSync('tar', ['-xzf', tgz, '-C', extracted], { stdio: 'pipe' });

    const result = { added: [], updated: [], unchanged: [] };
    for (const entry of entries) {
      const rel = checkEntry(entry);
      const src = path.join(extracted, rel);
      if (!fs.lstatSync(src).isFile()) throw new Error(`${rel} in the archive is not a regular file`);
      const dest = path.join(REPO_ROOT, rel);
      const exists = fs.existsSync(dest);
      if (exists && fs.readFileSync(dest).equals(fs.readFileSync(src))) {
        result.unchanged.push(rel);
        continue;
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      (exists ? result.updated : result.added).push(rel);
    }
    return result;
  } finally {
    cleanup();
    process.off('SIGINT', onSignal);
    process.off('SIGTERM', onSignal);
  }
}

// The download holds only these baselines, so it goes once they are applied.
// An unpacked folder goes only when it holds nothing else.
function removeArtifact(artifact) {
  if (artifact.kind === 'zip') {
    fs.rmSync(artifact.path, { force: true });
    return `Deleted ${artifact.path}`;
  }
  const other = fs.readdirSync(artifact.path).filter((n) => n !== TGZ_NAME && n !== '.DS_Store');
  if (other.length === 0) {
    fs.rmSync(artifact.path, { recursive: true, force: true });
    return `Deleted ${artifact.path}`;
  }
  fs.rmSync(path.join(artifact.path, TGZ_NAME), { force: true });
  return `Deleted ${path.join(artifact.path, TGZ_NAME)} (kept the folder, it holds other files)`;
}

// --- main -----------------------------------------------------------------------

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  let artifact;
  if (opts.file) {
    artifact = describe(path.resolve(opts.file));
    if (!artifact) fail(`${opts.file} is not a baselines artifact (expected argent-baselines--<date>Z--<branch>--run<N>.zip)`);
  } else {
    const found = scan(opts.dir);
    if (found.length === 0) {
      fail(
        `no baselines artifact in ${opts.dir}.\n` +
          'Download one from a run of the "E2E (Argent Cloud)" workflow started with update-baselines\n' +
          '(its name starts with argent-baselines--), or pass --dir <directory> or the file itself.'
      );
    }
    if (!process.stdin.isTTY) fail('not an interactive terminal: pass the artifact file instead');
    console.log(`Snapshot baselines in ${c.bold(opts.dir)}${found.length > 1 ? ', newest first' : ''}:`);
    artifact = await choose(found);
    if (!artifact) {
      console.log('Nothing changed.');
      return;
    }
  }

  let result;
  try {
    result = apply(artifact);
  } catch (err) {
    fail(`${err.message}\nThe artifact was kept: ${artifact.path}`);
  }

  console.log(`\nApplied ${c.bold(artifact.base)}`);
  for (const f of result.added) console.log(c.green(`  added    ${f}`));
  for (const f of result.updated) console.log(c.cyan(`  updated  ${f}`));
  console.log(
    `${result.added.length} added, ${result.updated.length} updated, ${result.unchanged.length} unchanged. Temporary files removed.`
  );
  try {
    console.log(removeArtifact(artifact));
  } catch (err) {
    console.error(`Could not delete the artifact (${err.message}). Delete it yourself: ${artifact.path}`);
  }
  if (result.added.length + result.updated.length > 0) {
    console.log(c.dim('Review the images (git status .argent/e2e), then commit them.'));
  }
}

main();

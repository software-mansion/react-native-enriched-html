---
name: review-changes
description: >
  Review a change in react-native-enriched: validate the code (diff review + static checks),
  check feature parity between iOS, Android and web, and test the change on devices with Argent.
  Read-only, never edits code. Use when the user asks to review / validate / QA a change, a branch,
  or a PR, or invokes the review-changes skill.
---

# Review changes

Agent-agnostic: works for any coding agent that supports Agent Skills (Codex, Claude Code, ...).
The **target** is whatever the user passed after the skill name (see step 0); none means
"uncommitted changes".

Usage: `review-changes [uncommitted | branch <name> | pr <number> | <base>..<head>] [--platform ios|android|web]`
(Claude Code: `/review-changes ...`, Codex: `$review-changes ...` or just ask for a review.)

This skill is the source of truth for review rules in this repo.
`.github/copilot-instructions.md` (GitHub Copilot PR review) is a condensed copy of stages 1
and 3 — when you change those rules, update it too.

Four stages, in order. Each has a reference file — read it when you reach that stage.

| # | Stage | Reference |
| --- | --- | --- |
| 1 | Code review | [references/code-review.md](references/code-review.md) |
| 2 | Static checks | [references/static-checks.md](references/static-checks.md) |
| 3 | Feature parity (iOS / Android / web) | [references/parity.md](references/parity.md) |
| 4 | Device testing with Argent | [references/device-testing.md](references/device-testing.md) |
| — | Final report | [references/report.md](references/report.md) |

## Ground rules

- **Read-only.** Don't edit source files; no `git add/commit/checkout/stash/reset/switch/push`, no
  posting to GitHub unless the user asks. Build output, Metro and installing the example app are
  fine; if a step (e.g. `pod install`) changes a tracked file, mention it in the report.
  `git fetch` is fine. Never switch revisions yourself (see step 0).
- **Evidence over claims.** Commit messages, PR bodies and earlier agent reports describe intent;
  verify them against the diff and the device.
- **Parity is part of correctness.** An undocumented divergence between iOS, Android and web is a
  `major` finding even when each platform looks fine on its own.
- **No device, no approval** for UI-affecting changes.

## 0. Resolve the target

Run `git fetch origin` first and compare against `origin/main`, never local `main`: a stale local
`main` pulls unrelated commits into the diff.

| Argument | Diff | Revision to validate |
| --- | --- | --- |
| empty / `uncommitted` | `git diff HEAD` + untracked files from `git status`; if the tree is clean, `git diff origin/main...HEAD` | the working tree |
| `branch <name>` | `git diff origin/main...<name>` | `git rev-parse <name>` |
| `pr <number>` | `gh pr view <n>` + `gh pr diff <n>`; the PR body is the stated intent | `gh pr view <n> --json headRefOid` |
| `<base>..<head>` | `git diff <base>...<head>` | `git rev-parse <head>` |

Stages 1 and 3 work from the diff. Stages 2 and 4 run on whatever is checked out, so for every
target except `uncommitted`, before stage 2 confirm that `git rev-parse HEAD` equals the revision
to validate and `git status --porcelain` is empty. If not, stop and ask the user to check out that
revision in a clean tree; don't switch revisions yourself. If they decline, report stages 2 and 4
as "not run: checkout is not at <revision>"; the verdict can't be `APPROVE`.

`--platform` limits **device testing** only; code review and parity always cover every platform.

Before stage 1, write down in one or two sentences what the change is supposed to do. Everything
afterwards is checked against that intent.

## Severity

- `blocker` — crash, data loss, broken build/typecheck, HTML corruption.
- `major` — wrong behaviour, unhandled common edge case, undocumented parity gap, failing check.
- `minor` — rare edge case, missing test/docs, intentional-but-undocumented platform difference.

Don't report style nits that the linters already catch.

## Verdict

`APPROVE` only when there are no blocker/major findings, no undocumented parity gaps, and device
testing passed on every affected native platform. Minor findings may accompany an approve.
Otherwise `CHANGES_REQUESTED`. Format: [references/report.md](references/report.md).

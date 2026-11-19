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
  fine; if a step (e.g. `pod install`) changes a tracked file, mention it in the report. If
  testing a branch/PR needs a checkout and the working tree is dirty, stop and ask.
- **Evidence over claims.** Commit messages, PR bodies and earlier agent reports describe intent;
  verify them against the diff and the device.
- **Parity is part of correctness.** An undocumented divergence between iOS, Android and web is a
  `major` finding even when each platform looks fine on its own.
- **No device, no approval** for UI-affecting changes.

## 0. Resolve the target

| Argument | Diff |
| --- | --- |
| empty / `uncommitted` | `git diff HEAD` + untracked files from `git status`; if the tree is clean, current branch vs `main` |
| `branch <name>` | `git diff main...<name>` (must be checked out to test on device) |
| `pr <number>` | `gh pr view <n>` + `gh pr diff <n>`; the PR body is the stated intent |
| `<base>..<head>` | `git diff <base>...<head>` |

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

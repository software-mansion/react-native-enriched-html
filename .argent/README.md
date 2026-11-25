# Argent e2e tests

Mobile e2e tests that run with [Argent](https://docs.swmansion.com/argent/docs/features/e2e),
on a hosted iOS simulator from [Argent Cloud](https://docs.swmansion.com/argent/docs/cloud/fundamentals/getting-started)
or on a local simulator or emulator. They replace the Maestro suite in `.maestro/`, which
stays until the port is done.

```
.argent/
  e2e/<suite>/*.yaml                 tests that run with the default text size
  e2e/<suite>/accessibility/*.yaml   tests that run with a large text size
  e2e/<suite>/__baselines__/<test>/  snapshot baselines (written by Argent)
  scripts/run-tests.sh               CI: simulator setup + install + run
  scripts/acquire-machine.sh         CI: Argent Cloud login, wait for a free machine
  scripts/setup-ios-remote.sh        CI: boot the simulator on that machine
  scripts/build-ios-app.sh           Release simulator build (JS bundle embedded)
```

## Argent Cloud runs only in CI

The repository has one Argent Cloud API key, stored as the `SIM_REMOTE_API_KEY` Actions
secret, and every run shares it. So Argent Cloud tests run only in the **E2E (Argent
Cloud)** workflow (`.github/workflows/e2e-argent.yml`), never on a local simulator or
emulator: one machine for every run keeps results, and baselines, comparable. Nobody needs
the key on their computer.

To test a change, push your branch and start the workflow from the Actions tab, or:

```bash
gh workflow run e2e-argent.yml --ref my-branch
gh workflow run e2e-argent.yml --ref my-branch -f tests=".argent/e2e/enrichedInput/core_controls_smoke.yaml"
gh workflow run e2e-argent.yml --ref my-branch -f update-baselines=true
```

| Input              | Default | Meaning                                                      |
| ------------------ | ------- | ------------------------------------------------------------ |
| `tests`            | empty   | Test files or directories, space separated. Empty runs every suite |
| `update-baselines` | `false` | Write snapshot baselines instead of comparing them           |
| `max-wait-minutes` | `30`    | How long to wait for a free machine                          |

**When the machine is busy**, the run waits for it. The acquire step's log and the run
summary say that the machine is in use and list the other runs of this workflow that are in
progress, one of which most likely holds it. If no other run is in progress, the machine is
probably held by a run that was killed before it could release it. The server frees it within
about 16 minutes. A run that gets no machine within `max-wait-minutes` fails with an error
that says so, and runs no tests. Every run releases the machine at the end, even when it fails
or is cancelled.

**New baselines**: run with `update-baselines`, download the `argent-baselines` artifact,
run `tar -xzf argent-baselines.tgz` at the repo root, review the images and commit them.

Failure screenshots and snapshot diffs are in the `argent-e2e-artifacts` artifact.

## Writing tests

See the [E2E YAML reference](https://docs.swmansion.com/argent/docs/reference/e2e-yaml).
Rules of thumb for this repo:

- Start every test with `launch: swmansion.enriched.example` and open the screen with
  `tap: { id: toggle-screen-button }`.
- Type into the editor with `tool: keyboard` (`args: { text: ... }` or `args: { key: enter }`),
  not `type:`. `type:` taps the centre of the field first, which moves the caret.
- After a screen change, `await: { visible: ... }` then `await: { idle: true }`.
- Snapshots: `snapshot: { name: ..., cropOn: { id: editor-input } }`, after a tap on
  `blur-button`. Review each new baseline before you commit it.
- Platform-only steps go in `when: { platform: ios }` / `when: { platform: android }`.

## Porting Maestro flows

| Maestro                                      | Argent                                                        |
| -------------------------------------------- | ------------------------------------------------------------- |
| `launchApp`                                  | `launch: swmansion.enriched.example`                          |
| `tapOn: { id }` / `{ text: 'regex' }`        | `tap: { id }` / `tap: { text: { matches: 'regex' } }`         |
| `doubleTapOn`                                | `tap: { on: <selector>, times: 2 }`                           |
| `longPressOn`                                | `long-press: <selector>`                                      |
| `tapOn` with `point` relative to an element  | no direct form; add a test hook to the example app            |
| `inputText`                                  | `tool: keyboard` + `args: { text }`                           |
| `pressKey: Enter` / `Backspace`              | `tool: keyboard` + `args: { key: enter }` / `{ key: backspace }` |
| `assertVisible`                              | `assert: { visible: <selector> }`                             |
| `extendedWaitUntil`                          | `await: { visible: <selector>, timeout }`                     |
| `waitForAnimationToEnd`                      | `await: { idle: true }`                                       |
| `swipe` / `scroll`                           | `swipe:` / `scroll-to:`                                       |
| `runFlow` without `env`                      | `run: <fragment>.yaml`                                        |
| `runFlow` with `env`                         | inline the steps (Argent fragments take no parameters)        |
| `runFlow: when: platform`                    | `when: { platform }` + `steps:`                               |
| `takeScreenshot` / `assertScreenshot`        | `snapshot:` (+ `--update-baselines`)                          |
| `addMedia`                                   | `simctl addmedia` in the setup script                         |
| tag `accessibility`                          | put the test in `<suite>/accessibility/`                      |
| tags `android-only` / `ios-only`             | `when: { platform }` around the steps                         |

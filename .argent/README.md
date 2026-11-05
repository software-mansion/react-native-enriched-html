# Argent e2e tests

Mobile e2e tests that run with [Argent](https://docs.swmansion.com/argent/docs/features/e2e)
on a hosted iOS simulator from [Argent Cloud](https://docs.swmansion.com/argent/docs/cloud/fundamentals/getting-started),
in GitHub Actions. They replace the Maestro suite in `.maestro/`, which stays until the port
is done.

```
.argent/
  e2e/<suite>/*.yaml                 tests that run with the default text size
  e2e/<suite>/accessibility/*.yaml   tests that run with a large text size
  e2e/<suite>/__baselines__/<test>/  snapshot baselines (written by Argent)
  scripts/run-tests.sh               CI: simulator setup + install + run
  scripts/acquire-machine.sh         CI: Argent Cloud login, wait for a free machine
  scripts/setup-ios-remote.sh        CI: boot the simulator on that machine
  scripts/build-ios-app.sh           CI: Debug simulator build (JS comes from Metro)
  scripts/e2e.mjs                    local: `yarn e2e`, start the workflow and follow it
  scripts/update-baselines.mjs       local: apply a downloaded baselines artifact
```

## Argent Cloud runs only in CI

The repository has one Argent Cloud API key, stored as the `SIM_REMOTE_API_KEY` Actions
secret, and every run shares it. So Argent Cloud tests run only in the **E2E (Argent
Cloud)** workflow (`.github/workflows/e2e-argent.yml`), never on a local simulator or
emulator: one machine for every run keeps results, and baselines, comparable. Nobody needs
the key on their computer.

To test a change, push your branch and run `yarn e2e`. It starts the workflow on your
current branch, follows it in the terminal and exits with its result. While the run goes, its
jobs and steps are redrawn every 10 seconds, and their names link to their logs on GitHub
(Cmd-click in most terminals). Ctrl-C or `q` stops following; the run itself keeps going. It needs the GitHub CLI
logged in (`gh auth login`), and it refuses to start when GitHub's copy of the branch is not
your `HEAD`, because the workflow runs what is on GitHub.

```bash
yarn e2e                                                   # every suite
yarn e2e .argent/e2e/enrichedInput/core_controls_smoke.yaml  # some tests (files or directories)
yarn e2e --update-baselines .argent/e2e/enrichedInput        # record baselines and apply them here
yarn e2e --max-wait-minutes 60 --no-watch                  # start it and exit
```

You can also start the workflow from the Actions tab, or with
`gh workflow run e2e-argent.yml --ref <branch> -f tests=... -f update-baselines=true`.

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

**New baselines**: `yarn e2e --update-baselines [tests...]` waits for the run, downloads its
baselines artifact and applies it (if the run failed, it asks first). For a run started
another way, download the artifact whose name starts with `argent-baselines--` from the run
page (the name also holds the UTC time, the branch and the run number), then run:

```bash
yarn e2e:update-baselines                     # pick one of the downloads in ~/Downloads
yarn e2e:update-baselines --dir ~/somewhere   # look in another folder
yarn e2e:update-baselines path/to/argent-baselines--…zip
```

The script copies and unpacks the artifact in a temporary directory, adds or replaces the
baselines under `.argent/e2e/`, deletes the temporary files, and then deletes the downloaded
artifact (it holds only these baselines; the run page keeps it for 14 days). Review the
images with `git status .argent/e2e` before you commit them.

Failure screenshots and snapshot diffs are in the `argent-e2e-artifacts` artifact.

### How the app is built and cached

The workflow has three jobs:

1. **Look up the cached app** (Ubuntu). Hashes every file that affects the native build:
   `ios/`, `cpp/`, the podspec, `src/spec/` and the root `package.json` (codegen), `apps/example/ios/` (with
   `Podfile.lock`), the example's assets, `yarn.lock`, the RN config files and
   `build-ios-app.sh`. The cache key is `argent-ios-app-<APP_CACHE_VERSION>-xcode<XCODE_VERSION>-<hash>`.
2. **Build the app** (macOS). Runs only when no cache entry has that key: builds a
   Debug simulator `.app` and saves it to the GitHub Actions cache.
3. **Run the e2e tests** (Ubuntu). Restores the `.app`, starts Metro on the runner, and
   runs the tests. `run-tests.sh` opens a reverse tunnel so the hosted simulator loads the
   JS bundle from that Metro.

So a change to JS or to the tests reuses the cached app and needs no macOS runner. A
change to native code builds once, and later runs with the same native code reuse it.

The cache is the repository's GitHub Actions cache (Settings > Actions > Caches, or
`gh cache list`). A run can read entries saved on its own branch and on `main`. Every push
to `main` that touches native code builds and caches the app for `main`, so a new branch
starts with a hit until it changes native code itself. GitHub evicts entries that are
unused for 7 days, and the oldest ones when the repository passes its cache size limit.
To force a rebuild, bump `APP_CACHE_VERSION` in the workflow or delete the entry with
`gh cache delete <key>`.

## Writing tests

See the [E2E YAML reference](https://docs.swmansion.com/argent/docs/reference/e2e-yaml).
Test files hold steps and `echo` labels only. How to run, record or port them belongs in
this README, not in comments in the YAML.

Rules for this repo:

- **Opening the test screen.** Start with `launch: swmansion.enriched.example`, then
  `tap: { id: toggle-screen-button }`, then `await: { visible: { id: blur-button } }` and
  `await: { idle: true }`. Prove the screen with `blur-button`, not `editor-input`: the
  start screen (DevScreen) has an `editor-input` too, so it proves nothing.
- **Typing into the editor.** Use `tool: keyboard` with `args: { text: ... }` or
  `args: { key: enter }` / `{ key: backspace }`. It types into whatever has focus, like
  Maestro's `inputText`. Do not use `type:`: it taps the centre of its target first, which
  moves the caret inside the editor.
- **Toolbar buttons.** On the test screen the toolbar is a grid inside the `full-screen`
  scroll view, below the editor. While the keyboard is up, and as the editor grows with
  text, its buttons can sit under the keyboard or below the screen. Argent does not scroll
  on its own, so put
  `scroll-to: { target: { id: toolbar-… }, direction: down, within: { id: full-screen } }`
  before every toolbar tap; it does nothing when the button is already visible. To only
  check that buttons are rendered, use `assert: { exists: ... }`.
- **Snapshots.** Tap `blur-button`, wait with `await: { idle: true }`, bring the editor back
  with `scroll-to: { target: { id: editor-input }, direction: up, within: { id: full-screen } }`,
  then `snapshot: { name: ..., cropOn: { id: editor-input } }`. That is what Maestro's
  `capture_or_assert_screenshot` subflow did. Baselines are written to
  `<suite>/__baselines__/<test>/` and belong to the pinned simulator (`IOS_VERSION` and
  `IOS_DEVICE_TYPE` in the workflow).
- **Recording a baseline.** A new snapshot step fails until it has a baseline. Record it with
  `yarn e2e --update-baselines <test file>`, review the images, commit them, then run the
  test normally once to see it pass.
- **Platform-only steps** go in `when: { platform: ios }` / `when: { platform: android }`.

## Ported tests

| Argent test                                  | Maestro source                                        | Baseline |
| -------------------------------------------- | ----------------------------------------------------- | -------- |
| `enrichedInput/core_controls_smoke.yaml`     | `.maestro/enrichedInput/flows/core_controls_smoke.yaml` | none needed |
| `enrichedInput/inline_styles_visual.yaml`    | `.maestro/enrichedInput/flows/inline_styles_visual.yaml` | not recorded yet |

Add a row for each test you port, and remove the Maestro flow once its Argent test passes in CI.

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

# Argent e2e tests

Mobile e2e tests that run with [Argent](https://docs.swmansion.com/argent/docs/features/e2e)
on a hosted iOS simulator from [Argent Cloud](https://docs.swmansion.com/argent/docs/cloud/fundamentals/getting-started),
in GitHub Actions only. They replace the Maestro suite in `.maestro/`, which stays until the
port is done. You run them from your terminal with two commands.

## Commands

### `yarn e2e`

```
yarn e2e [test ...] [--update-baselines] [--max-wait-minutes <n>] [--ref <branch>]
         [--no-watch] [--help]
```

Starts the **E2E (Argent Cloud)** workflow (`.github/workflows/e2e-argent.yml`) for a branch,
follows the run in the terminal, and exits with its result. With `--update-baselines` it also
downloads the new snapshot baselines and applies them to your checkout.

**Requirements**

- The [GitHub CLI](https://cli.github.com), logged in (`gh auth login`) with write access to
  the repository.
- Your branch pushed, with GitHub's copy at the same commit as your `HEAD`. The workflow runs
  what is on GitHub, not your working tree. Uncommitted changes only print a warning, and
  they are not part of the run.

**Arguments and options**

| Argument / option          | Default            | Effect |
| -------------------------- | ------------------ | ------ |
| `test ...`                 | every suite        | Test files or directories to run. Paths are relative to the directory you run `yarn` from, and must exist, be under `.argent/e2e/`, and contain no spaces. |
| `--update-baselines`       | off                | Write snapshot baselines instead of comparing them. When the run ends, download its `argent-baselines--…` artifact and apply it with `yarn e2e:update-baselines`. |
| `--max-wait-minutes <n>`   | `30`               | How long the run waits for a free Argent Cloud machine before it fails. A whole number. |
| `--ref <branch>`           | the current branch | Run another branch. It only has to exist on GitHub: unless it is your current branch, your `HEAD` is not compared with it. |
| `--no-watch`               | off                | Start the run, print its link, and exit. Baselines are then not applied. |
| `-h`, `--help`             |                    | Print the usage. |

Options that take a value also accept `--option=value`. The test paths and the next two
options are the workflow's inputs (`tests`, `update-baselines`, `max-wait-minutes`), with the
same defaults.

**What it does**

1. Checks the requirements above and stops with an error that names the problem.
2. Starts the workflow with the inputs, finds the new run and prints its link.
3. Shows the run's jobs and steps, refreshed every 10 seconds. The running job lists all its
   steps; a failed job keeps its finished steps listed. Job and step names link to their
   logs on GitHub (Cmd-click in most terminals). `q` or Ctrl-C stops following; the run
   itself keeps going, and the command prints its link and how to cancel it. Outside a
   terminal (CI, a pipe), each job and step line is printed once, when it changes.
4. Prints the result. For a failed run, it prints a direct link to each failed step and,
   without `--update-baselines`, the command that downloads the failure screenshots and
   diffs (`argent-e2e-artifacts`).
5. With `--update-baselines`: downloads the run's baselines artifact to a temporary folder,
   applies it with `yarn e2e:update-baselines`, and deletes the temporary folder. If the run
   did not pass, it asks before applying; outside a terminal it does not apply and prints
   the command that downloads the artifact. If the run uploaded no baselines, there is
   nothing to apply.

**Exit code**: `0` when the run passed (and its baselines, if requested, were applied); `1`
when it did not pass, or on any error; `130` when you stopped following it.

**Examples**

```bash
yarn e2e                                                      # every suite on the current branch
yarn e2e .argent/e2e/enrichedInput/core_controls_smoke.yaml   # one test
yarn e2e .argent/e2e/enrichedInput                            # one suite
yarn e2e --update-baselines .argent/e2e/enrichedInput/inline_styles_visual.yaml
yarn e2e --max-wait-minutes 60 --no-watch                     # start it and come back later
yarn e2e --ref main                                           # run main
```

### `yarn e2e:update-baselines`

```
yarn e2e:update-baselines [<artifact>] [--dir <folder>] [--help]
```

Applies a snapshot baselines artifact from a workflow run to `.argent/e2e/`, so the
baselines are ready to commit. `yarn e2e --update-baselines` calls it for you; run it
yourself for a run you started from the Actions tab, after downloading the artifact from the
run page.

**Arguments and options**

| Argument / option | Default        | Effect |
| ----------------- | -------------- | ------ |
| `<artifact>`      | none           | Apply this artifact without the list: a `.zip`, or a folder with `argent-baselines.tgz` in it, named as described below. |
| `--dir <folder>`  | `~/Downloads`  | Where to look for artifacts. |
| `-h`, `--help`    |                | Print the usage. |

**Which files it finds.** The workflow names every baselines artifact
`argent-baselines--<YYYYMMDD-HHMMSS>Z--<branch>--run<N>`: the UTC time the baselines were
packed, the branch (with characters other than letters, digits, `.`, `_` and `-` turned into
`-`), and the run number. GitHub downloads it as `<name>.zip` holding `argent-baselines.tgz`.
The command finds those `.zip` files, also with a `(1)` that browsers add to a repeated
download, and `<name>/` folders, which Safari and `gh run download` leave by unpacking the
zip. Other files are ignored.

**What it does**

1. Lists the artifacts found, newest first: the date and time in your time zone, the run
   number, the size, the branch, and `newest` / `unpacked` marks. ↑/↓ (or `j`/`k`) moves,
   Enter applies, `q`, Esc or Ctrl-C cancels without changing anything. The list appears
   even when there is one artifact, and needs a terminal; elsewhere, pass `<artifact>`.
2. Copies the artifact to a temporary folder and unpacks it there.
3. Checks every file in it. Each must be under `.argent/e2e/**/__baselines__/`; if any is
   not, it stops and changes nothing.
4. Adds new baselines, replaces changed ones, leaves identical ones alone, and lists what it
   added and updated.
5. Deletes the temporary folder, then the artifact: the `.zip`, or the folder (only its
   `.tgz` when the folder holds other files too). The artifact holds nothing but these
   baselines, and the run page keeps it for 14 days. When applying fails or you cancel, the
   artifact is kept.

Review the images (`git status .argent/e2e`) before you commit them.

**Exit code**: `0` when the baselines were applied or you cancelled; `1` on any error.

**Examples**

```bash
yarn e2e:update-baselines                      # pick from ~/Downloads
yarn e2e:update-baselines --dir ~/Desktop      # pick from another folder
yarn e2e:update-baselines ~/Downloads/argent-baselines--20261105-114012Z--my-branch--run7.zip
```

## How it works

### Why the tests run only in CI

The repository has one Argent Cloud API key, stored as the `SIM_REMOTE_API_KEY` Actions
secret, and every run shares it. So the tests run only in the workflow, never on a local
simulator or emulator: one kind of hosted simulator for every run keeps results, and
baselines, comparable. Nobody needs the key on their computer. The scripts under
`.argent/scripts/` that touch Argent Cloud refuse to run outside GitHub Actions.

### Starting the workflow without `yarn e2e`

From the Actions tab (**E2E (Argent Cloud)** → **Run workflow**) or with
`gh workflow run e2e-argent.yml --ref <branch> -f tests=... -f update-baselines=true`.

| Input              | Default | Meaning                                                      |
| ------------------ | ------- | ------------------------------------------------------------ |
| `tests`            | empty   | Test files or directories, space separated. Empty runs every suite |
| `update-baselines` | `false` | Write snapshot baselines instead of comparing them           |
| `max-wait-minutes` | `30`    | How long to wait for a free machine                          |

### When the machine is busy

The run waits for it. The acquire step's log and the run summary say that the machine is in
use and list the other runs of this workflow that are in progress, one of which most likely
holds it. If no other run is in progress, the machine is probably held by a run that was
killed before it could release it; the server frees it within about 16 minutes. A run that
gets no machine within `max-wait-minutes` fails with an error that says so, and runs no
tests. Every run releases the machine at the end, even when it fails or is cancelled.

### Artifacts

- `argent-e2e-artifacts` (failed runs): failure screenshots and snapshot diffs, and the
  `sim-remote` logs. Kept 7 days.
- `argent-baselines--<time>Z--<branch>--run<N>` (runs with `update-baselines`): the
  baselines. Kept 14 days.

### How the app is built and cached

The workflow has three jobs:

1. **Look up the cached app** (Ubuntu). Hashes every file that affects the native build:
   `ios/`, `cpp/`, the podspec, `src/spec/` and the root `package.json` (codegen), `apps/example/ios/` (with
   `Podfile.lock`), the example's assets, `yarn.lock`, the RN config files and
   `build-ios-app.sh`. The cache key is `argent-ios-app-<APP_CACHE_VERSION>-xcode<XCODE_VERSION>-<hash>`.
2. **Build the app** (macOS). Runs only when no cache entry has that key: builds an
   unsigned Release simulator `.app` and saves it to the GitHub Actions cache.
3. **Run the e2e tests** (Ubuntu). Restores the `.app` and repacks it with this commit's JS
   (`repack-ios-app.sh`), then runs the tests on it.

**Repacking** is the same idea as [Expo's repack](https://docs.expo.dev/build-reference/repack/),
done with plain React Native because the example app does not use Expo. The cached app holds
the JS bundle of the commit it was built from. The script rebuilds the bundle from the
checkout exactly as Xcode's "Bundle React Native code and images" phase does (Metro, then
`hermesc` from React Native's `hermes-compiler` package, which has a Linux build), and swaps
it and the JS image assets into a copy of the app. It refuses to produce an app that would
not run:

- The new Hermes bytecode must have the same version as the bundle Xcode put in the app. If
  the npm `hermes-compiler` and the app's Hermes engine ever disagree, the step fails and
  says to rebuild the app (bump `APP_CACHE_VERSION`).
- The app must be unsigned (`build-ios-app.sh` builds it so), because a signature seals the
  bundle. Simulators run unsigned apps.
- The app must not use React Native's `RCTUseAssetCatalog` image catalog, which only macOS
  can compile.

So a change to JS or to the tests reuses the cached app and needs no macOS runner, and every
run still tests a Release build: the same JS engine mode as a shipped app, no Metro and no
development overlays. A change to native code builds once, and later runs with the same
native code reuse it.

The cache is the repository's GitHub Actions cache (Settings > Actions > Caches, or
`gh cache list`). A run can read entries saved on its own branch and on `main`. Every push
to `main` that touches native code builds and caches the app for `main`, so a new branch
starts with a hit until it changes native code itself. GitHub evicts entries that are
unused for 7 days, and the oldest ones when the repository passes its cache size limit.
To force a rebuild, bump `APP_CACHE_VERSION` in the workflow or delete the entry with
`gh cache delete <key>`.

## Layout

```
.argent/
  e2e/<suite>/*.yaml                 tests that run with the default text size
  e2e/<suite>/accessibility/*.yaml   tests that run with a large text size
  e2e/<suite>/__baselines__/<test>/  snapshot baselines (written by Argent)
  scripts/e2e.mjs                    `yarn e2e`
  scripts/update-baselines.mjs       `yarn e2e:update-baselines`
  scripts/acquire-machine.sh         CI: Argent Cloud login, wait for a free machine
  scripts/build-ios-app.sh           CI: unsigned Release simulator build (macOS)
  scripts/repack-ios-app.sh          CI: swap this commit's JS into the cached app
  scripts/setup-ios-remote.sh        CI: boot the simulator on the machine
  scripts/run-tests.sh               CI: install the app, run the tests
```

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
- **If text gets the wrong styles.** A toolbar tap reaches the native editor through
  JavaScript, while Argent types right away. The tests run without waits there, on the
  assumption that the Release build is fast enough. If a snapshot shows styles landing on
  the wrong words, put
  `await: { idle: true }` after the toolbar taps and `tool: keyboard` steps around them.
  `idle` reports a blinking caret as "a small part kept moving"; that warning is expected.
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
  `IOS_DEVICE_TYPE` in the workflow). Argent names and finds them itself, so do not rename
  the folder or the files: `<snapshot name>__<platform>-<width>x<height>.png`, plus
  `-crop-<hash>` when the snapshot has `cropOn` (the hash identifies the crop selector, so a
  changed `cropOn` gets a new baseline instead of being compared with the old one).
- **Recording a baseline.** A new snapshot step fails until it has a baseline. Record it with
  `yarn e2e --update-baselines <test file>`, then compare each image with the Maestro
  screenshot of the same name in `.maestro/<suite>/screenshots/ios/`: the text and styles
  must match (the rendering may differ slightly, the simulator does). Commit the images,
  then run the test normally once to see it pass.
- **Platform-only steps** go in `when: { platform: ios }` / `when: { platform: android }`.

## Ported tests

| Argent test                                  | Maestro source                                        | Baseline |
| -------------------------------------------- | ----------------------------------------------------- | -------- |
| `enrichedInput/core_controls_smoke.yaml`     | `.maestro/enrichedInput/flows/core_controls_smoke.yaml` | none needed |
| `enrichedInput/inline_styles_visual.yaml`    | `.maestro/enrichedInput/flows/inline_styles_visual.yaml` | wrong, re-record (styles landed on the wrong words) |
| `enrichedInput/paragraph_styles_blocks_visual.yaml` | `.maestro/enrichedInput/flows/paragraph_styles_blocks_visual.yaml` | not recorded yet |

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

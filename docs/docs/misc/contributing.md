---
sidebar_position: 5
---

# Contributing

Contributions are always welcome, no matter how large or small. This page will walk you through the development workflow. Before contributing, please read the
[code of conduct](https://github.com/software-mansion/react-native-enriched-html/blob/main/CODE_OF_CONDUCT.md).

## Development workflow

The project is a monorepo managed with
[Yarn workspaces](https://yarnpkg.com/features/workspaces). It contains three
packages:

- the library package, in the root directory;
- an example app, in `apps/example/`;
- this documentation site, in `docs/` (a standalone project with its own
  dependencies - see [Documentation](#documentation)).

Install dependencies for every package by running `yarn` in the root directory:

```sh
yarn
```

:::note

Because the project relies on Yarn workspaces, you can't use `npm` for
development.

:::

The [example app](https://github.com/software-mansion/react-native-enriched-html/tree/main/apps/example)
demonstrates the library and is how you test any changes you make. It's
configured to use the local version of the library, so your source changes are
reflected there:

- **JavaScript** changes show up without a rebuild.
- **Native** changes (Objective-C, Swift, Java, Kotlin) require rebuilding the
  example app.

### Editing native code

To edit the native code in an IDE:

- **iOS** - open `apps/example/ios/EnrichedTextInputExample.xcworkspace` in
  Xcode. Find the sources under **Pods > Development Pods >
  ReactNativeEnrichedHtml**.
- **Android** - open `apps/example/android` in Android Studio. Find the sources
  under **react-native-enriched-html** in the **Android** view.

### Running the example app

Start the Metro bundler:

```sh
yarn example start
```

Run the app:

```sh
# Android
yarn example android

# iOS
yarn example ios
```

To confirm the app is running with the New Architecture, look for a line like
this in the Metro logs:

```sh
Running "EnrichedTextInputExample" with {"fabric":true,"initialProps":{"concurrentRoot":true},"rootTag":1}
```

Note the `"fabric":true` and `"concurrentRoot":true` properties.

## Linting, types, and tests

Make sure your code passes TypeScript and ESLint:

```sh
yarn typecheck
yarn lint
```

Fix formatting errors automatically:

```sh
yarn lint --fix
```

Add tests for your change where possible, and run the unit tests:

```sh
yarn test
```

The project uses [TypeScript](https://www.typescriptlang.org/) for type
checking, [ESLint](https://eslint.org/) with [Prettier](https://prettier.io/)
for linting and formatting, and [Jest](https://jestjs.io/) for testing.

:::note

Pre-commit hooks verify that the linter and typecheck pass when you commit.

:::

## End-to-end tests

### Mobile (Maestro)

We use [Maestro](https://maestro.mobile.dev/) for mobile end-to-end testing.
Flows live in `.maestro/enrichedInput/flows/` and
`.maestro/enrichedText/flows/`. Shared subflows live in `.maestro/subflows/`,
with component-specific subflows in `.maestro/enrichedInput/subflows/` and
`.maestro/enrichedText/subflows/`.

**Prerequisites:**

- **Maestro CLI** (v2.3.0+) - follow the
  [Getting Started guide](https://github.com/mobile-dev-inc/maestro?tab=readme-ov-file#getting-started),
  then ensure `~/.maestro/bin` is in your `PATH`.
- **iOS** - Xcode, with `xcrun` available (it ships with the Xcode Command Line
  Tools).
- **Android** - the Android SDK with SDK Command-line Tools, Platform-Tools, and
  Emulator. Set `ANDROID_HOME` (typically `$HOME/Library/Android/sdk` on macOS)
  and add these to your `PATH`:
  - `$ANDROID_HOME/cmdline-tools/latest/bin`
  - `$ANDROID_HOME/platform-tools`
  - `$ANDROID_HOME/emulator`

The target devices are:

| Platform | Device    | OS                            |
| -------- | --------- | ----------------------------- |
| iOS      | iPhone 17 | iOS 26.2                      |
| Android  | Pixel 9   | API 36 "Baklava" (Android 16) |

**Running the tests** - start the Metro bundler first, then run a suite. Each
command sets up the device and runs all Maestro flows, building only when
necessary:

```sh
yarn example start

# Both platforms sequentially
yarn test:e2e:mobile

# Single platform
yarn test:e2e:ios
yarn test:e2e:android
```

Target a specific flow or force a rebuild:

```sh
# Run a single flow
yarn test:e2e:ios .maestro/enrichedInput/flows/core_controls_smoke.yaml

# Force a fresh build even if the app is already installed
yarn test:e2e:android --rebuild
```

**Visual regression tests** - some flows compare a screenshot of the component
against a saved baseline in `.maestro/enrichedInput/screenshots/` or
`.maestro/enrichedText/screenshots/`. By default the baseline is asserted; pass
`--update-screenshots` to capture new baselines instead:

```sh
# Update baselines on both platforms
yarn test:e2e:mobile --update-screenshots

# Single platform
yarn test:e2e:ios --update-screenshots
yarn test:e2e:android --update-screenshots .maestro/enrichedInput/flows/inline_styles_visual.yaml
```

Always review newly saved screenshots before committing them.

:::note Flaky Android tests on macOS

macOS may throttle the Android emulator via **App Nap** when its window isn't
visible, which can cause test timeouts. Either keep the emulator window visible
while tests run, or disable App Nap for the emulator:

```sh
defaults write com.google.android.emulator NSAppSleepDisabled -bool YES
```

This requires an emulator restart and may drain your battery, so you may want
to re-enable it afterwards with `-bool NO`.

:::

### Web (Playwright)

We use [Playwright](https://playwright.dev/) for end-to-end testing of the web
example. Tests live in `.playwright/tests/`. Install the browser binaries once:

```sh
yarn playwright install
```

Run the suite from the root directory:

```sh
yarn test:e2e:web
```

**Visual regression tests** - some tests compare a screenshot of the component
against a saved baseline in `.playwright/screenshots/`. By default the baseline is asserted; pass
`--update-screenshots` to capture new baselines instead:

```sh
yarn test:e2e:web --update-screenshots
```

Append `--ui` for Playwright's
[UI mode](https://playwright.dev/docs/test-ui-mode) (pick tests, watch runs,
inspect traces). The Playwright config starts the Vite dev server
automatically, so you don't need to run `yarn example-web dev` separately.

## Documentation

The site you're reading is built with [Docusaurus](https://docusaurus.io/) and
lives in the `docs/` directory. It's a standalone project with its own
`yarn.lock`, separate from the monorepo workspace, so install its dependencies
from inside the folder:

```sh
cd docs
yarn
```

Then start the local dev server:

```sh
yarn start
```

A few things worth knowing:

- Pages are Markdown / MDX files in `docs/docs/`; the navigation is generated
  from the folder structure and `_category_.json` files. Filenames are
  kebab-case.
- If you make any changes, run `yarn build` before opening a pull request, to make sure the project successfully builds.

:::info

When you change the public API or behaviour, please update the documentation in
the same pull request whenever possible. Keeping the docs in sync with the code
is one of the most valuable ways to contribute.

:::

## Commit message convention

We follow the
[conventional commits specification](https://www.conventionalcommits.org/en).
Pre-commit hooks verify the format when you commit:

- `fix`: bug fixes, e.g. fix crash due to deprecated method.
- `feat`: new features, e.g. add a new method to the module.
- `refactor`: code refactor, e.g. migrate from class components to hooks.
- `docs`: documentation changes, e.g. add a usage example for the module.
- `test`: adding or updating tests, e.g. add integration tests.
- `chore`: tooling changes, e.g. change CI config.

## Scripts

The `package.json` file contains scripts for common tasks:

- `yarn` - set up the project by installing dependencies.
- `yarn typecheck` - type-check files with TypeScript.
- `yarn lint` - lint files with ESLint.
- `yarn test` - run unit tests with Jest.
- `yarn example start` - start the Metro server for the example app.
- `yarn example android` - run the example app on Android.
- `yarn example ios` - run the example app on iOS.
- `yarn test:e2e` - run all E2E tests (mobile + web) sequentially.
- `yarn test:e2e:mobile` - run mobile E2E tests on iOS and Android sequentially.
- `yarn test:e2e:android` - run E2E tests on Android.
- `yarn test:e2e:ios` - run E2E tests on iOS.
- `yarn test:e2e:web` - run E2E tests on the web example with Playwright.

## Sending a pull request

:::tip

Working on your first pull request? Learn how from this free series:
[How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

:::

When you send a pull request:

- Prefer small pull requests focused on one change.
- Verify that linters and tests are passing.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with the
  maintainers first by opening an issue.

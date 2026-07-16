---
slug: /
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Getting started

The goal of the _Fundamentals_ section is to get you from an empty project to a
working rich text editor and to give you the mental model you need to build on
your own. Let's dive in.

## What is React Native Enriched HTML?

React Native Enriched HTML is a rich text solution for React Native built by
[Software Mansion](https://swmansion.com/).

It ships two fully native components: `EnrichedTextInput`, a rich text editor
that styles text live as you type, and `EnrichedText`, a read-only display component that
renders the input's output. Both speak HTML — the input
produces it, the display consumes it.

Not only does this library allow you to apply basic rich text styles you know well,
like *bold* or _italic_, but also provides more powerful tools like `mentions`, something
you will learn more about in the next chapters.

iOS and Android are and Web are all supported. iOS and Android are both stable, where Web is still experimental, so expect
its behavior to change between releases.

## Prerequisites

The library works only with the
[React Native New Architecture (Fabric)](https://reactnative.dev/architecture/landing-page).
It's enabled by default on recent React Native versions; if your app still runs
the old architecture you'll need to switch before installing.

For the exact React Native versions we support, see
[Compatibility](/misc/compatibility).

## Installation

### Bare React Native

Install the package:

<Tabs groupId="package-managers">
  <TabItem value="npm" label="NPM">
    ```bash
    npm install react-native-enriched-html
    ```
  </TabItem>

  <TabItem value="yarn" label="YARN">
    ```bash
    yarn add react-native-enriched-html
    ```
  </TabItem>
</Tabs>

The library contains native code, so rebuild your app after installing. On iOS,
install the pods first:

```sh
cd ios && bundler install && bundler exec pod install
```

### Expo

Install with the Expo CLI so the correct version is picked for your SDK:

```sh
npx expo install react-native-enriched-html
```

Then regenerate the native projects:

```sh
npx expo prebuild
```

:::note

The library needs native code, so it won't run in Expo Go. Use a
[development build](https://docs.expo.dev/develop/development-builds/introduction/)
instead.

:::

### Web

Install the package:

<Tabs groupId="package-managers">
  <TabItem value="npm" label="NPM">
    ```bash
    npm install react-native-enriched-html
    ```
  </TabItem>

  <TabItem value="yarn" label="YARN">
    ```bash
    yarn add react-native-enriched-html
    ```
  </TabItem>
</Tabs>

The shipped components share the React Native's API, minus the functionalities a
browser can't provide. See the _Web support_ guide for what's covered.

## Nightly builds

To try features before they land in a stable release, install the nightly
build:

<Tabs groupId="package-managers">
  <TabItem value="npm" label="NPM">
    ```bash
    npm install react-native-enriched-html@nightly
    ```
  </TabItem>

  <TabItem value="yarn" label="YARN">
    ```bash
    yarn add react-native-enriched-html@nightly
    ```
  </TabItem>
</Tabs>

Nightlies are published to npm automatically and may contain breaking changes.

---

You're set up. Next, let's [build your first editor](/fundamentals/your-first-editor).

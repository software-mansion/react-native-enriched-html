import React from 'react';
import { EnrichedTextInput } from 'react-native-enriched-html';
import { StyleSheet } from 'react-native'

// Exposed as globals inside every ```jsx live``` code block on the site
// (see https://docusaurus.io/docs/markdown-features/code-blocks#interactive-code-editor).
const ReactLiveScope = {
  React,
  ...React,
  EnrichedTextInput,
  StyleSheet
};

export default ReactLiveScope;

import React from 'react';
import { MDXComponents as trexMDXComponents } from '@swmansion/t-rex-ui';
import LiveCodeBlock from '@theme/LiveCodeBlock';

// t-rex-ui's own `code` component already picks between its branded
// CodeInline and CodeBlock - reuse it as-is so styling stays identical
// for everything that isn't a live code block.
const TrexCode = trexMDXComponents.code;

function isLiveCodeBlock(props) {
  return !!props.live;
}

export default function CodeBlock(props) {
  return isLiveCodeBlock(props) ? (
    <LiveCodeBlock {...props} />
  ) : (
    <TrexCode {...props} />
  );
}

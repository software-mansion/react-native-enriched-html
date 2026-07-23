import MDXComponents from '@theme-original/MDXComponents';
import Details from '@site/src/theme/MDXComponents/Details';
import CollapsibleCode from '@site/src/components/CollapsibleCode';
import PlatformCompatibility from '@site/src/components/PlatformCompatibility';
import ExampleVideo from '@site/src/components/ExampleVideo';
import ThemedVideo from '@site/src/components/ThemedVideo';
import Optional from '@site/src/components/Optional';
import Indent from '@site/src/components/Indent';
import Row from '@site/src/components/Row';
import Grid from '@site/src/components/Grid';
import { Yes, No, Version, Spacer } from '@site/src/components/Compatibility';
import EnrichedHtmlCompatibility from '@site/src/components/Compatibility/EnrichedHtmlCompatibility';
import { Badges } from '@swmansion/t-rex-ui';

export default {
  ...MDXComponents,
  details: Details,
  CollapsibleCode,
  PlatformCompatibility,
  ExampleVideo,
  ThemedVideo,
  Optional,
  Indent,
  Row,
  Grid,
  Yes,
  No,
  Version,
  Spacer,
  EnrichedHtmlCompatibility,
  Badges,
};

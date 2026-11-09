import React from 'react';
import { PageMetadata } from '@docusaurus/theme-common';
import { useDoc } from '@docusaurus/plugin-content-docs/client';

// The t-rex-ui DocItem/Metadata derives a per-page og:image path
// (img/og/<title>.png) that this site doesn't ship, so every page's
// og:image would 404. Restore the classic behavior: without a page
// image, Docusaurus falls back to themeConfig.image (og-image.png).
export default function DocItemMetadata() {
  const { metadata, frontMatter, assets } = useDoc();
  return (
    <PageMetadata
      title={metadata.title}
      description={metadata.description}
      keywords={frontMatter.keywords}
      image={assets.image ?? frontMatter.image}
    />
  );
}
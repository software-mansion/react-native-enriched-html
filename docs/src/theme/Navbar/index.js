import React from 'react';
import { useLocation } from '@docusaurus/router';
import { Navbar, TopbarBanner, isBannerHidden } from '@swmansion/t-rex-ui';
import { TOP_BAR_BANNER } from '@site/src/components/topbarBanner.config';

export default function NavbarWrapper(props) {
  const location = useLocation();
  const bannerHidden = isBannerHidden(
    location.pathname,
    TOP_BAR_BANNER.hiddenPaths,
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
       {!bannerHidden && (
        <TopbarBanner
          zones={TOP_BAR_BANNER.zones}
          rotateIntervalMs={TOP_BAR_BANNER.rotateIntervalMs}
        />
      )}
      <Navbar
        useLandingLogoDualVariant={true}
        isAlgoliaActive={false}
        {...props}
      />
    </div>
  );
}

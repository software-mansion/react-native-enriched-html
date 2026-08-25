import type { ClientModule } from '@docusaurus/types';
import type { BannerZone } from '@swmansion/t-rex-ui';
import { TOP_BAR_BANNER } from '../components/topbarBanner.config';

// Revive's async tag only scans <ins> slots once, on initial load; re-trigger it after each SPA nav so remounted slots get filled.
const contentIds = Array.from(
  new Set(TOP_BAR_BANNER.zones.map((zone: BannerZone) => zone.contentId)),
);

function refreshBannerContent() {
  contentIds.forEach((contentId) => {
    document.dispatchEvent(new CustomEvent(`content-${contentId}-refresh`));
  });
}

export const onRouteDidUpdate: ClientModule['onRouteDidUpdate'] = ({
  previousLocation,
  location,
}) => {
  if (!previousLocation || previousLocation.pathname === location.pathname) {
    return;
  }
  // Defer until after the new route's <ins> nodes are actually in the DOM.
  setTimeout(refreshBannerContent, 0);
};
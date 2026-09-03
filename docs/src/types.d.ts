/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/theme-classic" />

// t-rex-ui publishes no type declarations (its package.json points at a
// dist/main.d.ts that is not shipped). Only the exports used from checked
// TypeScript files are declared here; the .js theme overrides that import
// its components are not typechecked and need no declarations.
declare module '@swmansion/t-rex-ui' {
  export interface BannerZone {
    zoneId: string;
    contentId: string;
    fallbackBgColor?: string;
  }
}

declare module '*.otf';
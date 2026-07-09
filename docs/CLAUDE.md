# React Native Enriched HTML docs site

Docusaurus site for React Native Enriched HTML, scaffolded from
[react-native-screens-docs](https://github.com/software-mansion/react-native-screens-docs).
Deployed to `https://docs.swmansion.com/react-native-enriched-html/` via GitHub Pages.

## Working in this folder

- `yarn && yarn start` runs the dev server. `yarn build` must pass before
  merging; broken links and anchors fail the build (`onBrokenLinks: throw`).
- This folder is a standalone yarn project with its own `yarn.lock`,
  separate from the repo workspace. Repo-level eslint and tsc exclude it.
- Never commit `build/`, `.docusaurus/`, or `node_modules/`.

## Content

- Pages live in `docs/`, navigation in `sidebars.js`. Docs are served at the
  site root (`routeBasePath: '/'`); `docs/fundamentals/intro.md` has `slug: /`
  and is the homepage. There is no landing page - the product landing is
  https://enriched.swmansion.com.
- Filenames are kebab-case, including component reference pages.
- The current structure (Fundamentals / Guides / API Reference) is a default;
  restructure freely, keeping `sidebars.js` in sync.

## MDX components

Registered in `src/theme/MDXComponents.js`, same conventions as the
react-native-reanimated docs (without interactive examples):
`PlatformCompatibility`, `CollapsibleCode`, `Optional`, `Yes`, `No`,
`Version`, `Spacer`, `Row`, `Grid`, `Indent`, `ExampleVideo`, `ThemedVideo`,
`Badges` (t-rex-ui), plus restyled admonitions, `<details>`, Tabs, diff and
highlighted code blocks, and Mermaid diagrams.

## Site configuration (`docusaurus.config.js`)

- Version label: `presets` > `docs.versions.current.label` (now `1.x`).
- `noIndex: true` and a blocking `static/robots.txt` keep the pre-launch
  deploy out of search engines; remove both at launch.
- Google Tag Manager is commented out in `plugins`; add a container id to
  enable analytics.
- Algolia DocSearch credentials are placeholders. Apply for DocSearch only
  after the site is public, indexable, and on its final URL.

## Deploy

`.github/workflows/docs-publish.yml` deploys to the `gh-pages` branch on
every push to `main` that touches `docs/**`. GitHub Pages must be enabled in
the repo settings (serve from `gh-pages`). `docs-build.yml` builds on PRs.

## Theme gotchas

- The theme is `@swmansion/t-rex-ui`. It treats the page at the site root as
  a "landing page": `navbar.hideOnScroll` must stay `false` and the
  `navbarLanding` override in `src/css/overrides.css` must stay, otherwise
  the sidebar covers the navbar logo on the homepage.
- Navbar logos are `static/img/logo.svg` / `logo-dark.svg` (from the
  enriched landing repo branding).

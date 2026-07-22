// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

import { topbarBannerReservationScript } from '@swmansion/t-rex-ui/topbar-banner'; 
import { TOP_BAR_BANNER } from './src/components/topbarBanner.config.ts'; 

const path = require('path');

const lightCodeTheme = require('./src/theme/CodeBlock/highlighting-light.js');
const darkCodeTheme = require('./src/theme/CodeBlock/highlighting-dark.js');

function reactNativeWebPlugin() {
  return {
    name: 'react-native-web',
    configureWebpack() {
      return {
        mergeStrategy: { 'resolve.extensions': 'prepend' },
        resolve: {
          alias: { 'react-native$': 'react-native-web' },
          extensions: ['.web.js', '...'],
        },
      };
    },
  };
}

function enrichedHtmlLocalSourcePlugin() {
  const librarySource = path.resolve(__dirname, '../src');
  return {
    name: 'enriched-html-local-source',
    configureWebpack(_config, isServer, utils) {
      return {
        module: {
          rules: [
            {
              test: /\.tsx?$/,
              include: librarySource,
              use: [utils.getJSLoader({ isServer })],
            },
          ],
        },
        resolve: {
          alias: {
            'react-native-enriched-html$': path.resolve(
              librarySource,
              'index.tsx'
            ),
            // The react-native-enriched-html has separate react and react-dom dependencies in node_modules,
            // so React would otherwise be resolved from the repo root and bundled twice.
            'react': path.resolve(__dirname, 'node_modules/react'),
            'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
          },
        },
      };
    },
  };
}

const firstBannerZone = TOP_BAR_BANNER.zones[0];
const bannerReservationHeadTags = firstBannerZone
  ? [
      {
        tagName: 'script',
        attributes: { type: 'text/javascript' },
        innerHTML: topbarBannerReservationScript(
          firstBannerZone.zoneId,
          firstBannerZone.contentId,
          TOP_BAR_BANNER.hiddenPaths,
        ),
      },
    ]
  : [];

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'React Native Enriched HTML',
  favicon: 'img/favicon.png',

  url: 'https://docs.swmansion.com',

  baseUrl: '/react-native-enriched-html/',

  organizationName: 'software-mansion',
  projectName: 'react-native-enriched-html',

  // TODO: remove once the site is ready for public traffic. Until then,
  // keep the deploy hidden from search engines.
  noIndex: true,

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          breadcrumbs: false,
          sidebarPath: require.resolve('./sidebars.js'),
          sidebarCollapsible: false,
          editUrl:
            'https://github.com/software-mansion/react-native-enriched-html/edit/main/docs/',
          lastVersion: 'current',
          versions: {
            current: {
              label: '1.x',
              banner: 'none',
            },
          },
        },
        theme: {
          customCss: require.resolve('./src/css/index.css'),
        },
      }),
    ],
    require.resolve('@swmansion/t-rex-ui/preset'),
  ],

  headTags: bannerReservationHeadTags,

  clientModules: [require.resolve('./src/clientModules/topbarBannerRefresh.ts')],

  plugins: [
    reactNativeWebPlugin,
    enrichedHtmlLocalSourcePlugin,
    function transpileTRexUiTheme() {
      return {
        name: 'transpile-t-rex-ui-theme',
        configureWebpack(_config, isServer, utils) {
          return {
            module: {
              rules: [
                {
                  test: /\.jsx?$/,
                  include:
                    /node_modules[\\/]@swmansion[\\/]t-rex-ui[\\/]theme[\\/]/,
                  use: [utils.getJSLoader({ isServer })],
                },
              ],
            },
          };
        },
      };
    },
    process.env.NODE_ENV === 'production' && [
      '@docusaurus/plugin-google-tag-manager',
      {
        containerId: 'GTM-N5QK8TMT',
      },
    ],
  ].filter(Boolean),

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/og-image.png',
      metadata: [
        { name: 'og:image:width', content: '1200' },
        { name: 'og:image:height', content: '630' },
      ],
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        hideOnScroll: false,
        logo: {
          alt: 'React Native Enriched HTML logo',
          src: 'img/logo.svg',
          srcDark: 'img/logo-dark.svg',
        },
        items: [
          {
            to: '/',
            label: 'Docs',
            position: 'right',
          },
          {
            type: 'docsVersionDropdown',
            position: 'right',
            dropdownActiveClassDisabled: true,
          },
          {
            'href':
              'https://github.com/software-mansion/react-native-enriched-html/',
            'position': 'right',
            'className': 'header-github',
            'aria-label': 'GitHub repository',
          },
        ],
      },
      footer: {
        style: 'light',
        links: [],
        copyright:
          'All trademarks and copyrights belong to their respective owners.',
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['bash', 'diff', 'json', 'mermaid'],
      },
      // TODO: replace placeholders with real DocSearch credentials once
      // Algolia approval lands. Required so preset-classic activates
      // @docusaurus/theme-search-algolia and `@theme/SearchTranslations`
      // alias resolves during build.
      algolia: {
        appId: 'PLACEHOLDER_APP_ID',
        apiKey: 'PLACEHOLDER_API_KEY',
        indexName: 'react-native-enriched-html',
      },
    }),
};

module.exports = config;

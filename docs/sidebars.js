// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Fundamentals',
      items: [
        'fundamentals/intro',
        'fundamentals/getting-started',
        'fundamentals/installation',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: ['guides/index'],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: ['api-reference/index'],
    },
  ],
};

module.exports = sidebars;

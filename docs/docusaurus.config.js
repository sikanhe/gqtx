module.exports = {
  title: 'gqtx',
  tagline: 'Type-safety GraphQL without manual work',
  url: 'https://gqtx.dev',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'sikanhe',
  projectName: 'gqtx',
  themeConfig: {
    respectPrefersColorScheme: true,
    hideableSidebar: true,
    navbar: {
      title: 'gqtx',
      logo: {
        alt: 'gqtx Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          href: 'https://github.com/sikanhe/gqtx',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [],
      copyright: `Copyright © ${new Date().getFullYear()} Sikan He. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          path: 'src',
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/sikanhe/gqtx/edit/master/docs/',
        },
      },
    ],
  ],
};

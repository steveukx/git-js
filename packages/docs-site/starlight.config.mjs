const config = {
  title: 'simple-git',
  description: 'Documentation for the simple-git library',
   customCss: [
      './src/assets/simple-git-docs.css',
   ],
   logo: {
      light: './src/assets/logo-light-mode.svg',
      dark: './src/assets/logo-dark-mode.svg',
   },
  social: {
    github: 'https://github.com/steveukx/git-js'
  },
  sidebar: [
    {
      label: 'Overview',
      items: [{ slug: 'index' }, { slug: 'generated/readme' }]
    },
    {
      label: 'Guides',
      autogenerate: { directory: 'generated/guides' }
    },
    {
      label: 'API Reference',
      autogenerate: { directory: 'api' }
    }
  ]
};

export default config;

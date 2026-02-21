import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightConfig from './starlight.config.mjs';

export default defineConfig({
  output: 'static',
  integrations: [starlight(starlightConfig)]
});

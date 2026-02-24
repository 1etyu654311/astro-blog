// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://1etyu654311.github.io',
  base: '/astro-blog',
  integrations: [mdx(), sitemap()],
});

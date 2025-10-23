import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: 'static',
  outDir: './dist',
  build: {
    format: 'directory'
  },
  server: {
    port: 20000,
    host: true
  }
});

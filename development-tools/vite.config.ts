import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('../application', import.meta.url)),
  envDir: fileURLToPath(new URL('..', import.meta.url)),
  publicDir: '../generated-output/public-assets',
  plugins: [react()],
  server: { port: 5177, strictPort: true },
  build: { outDir: '../generated-output/website', emptyOutDir: true },
});

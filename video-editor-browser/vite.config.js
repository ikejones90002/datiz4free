import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // ensures relative paths for GitHub Pages / Netlify
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'esnext',
  },
});

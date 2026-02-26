import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'node20',
  bundle: true,
  minify: false,
  sourcemap: false,
  clean: true,
  dts: false,
  platform: 'node',
  banner: {
    js: '#!/usr/bin/env node',
  },
});

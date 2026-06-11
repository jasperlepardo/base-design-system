import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import dts from 'vite-plugin-dts';

// Library build: emits ESM + .d.ts. CSS is bundled to dist/index.css and
// imported as a side-effect from src/index.ts.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({ include: ['src'], exclude: ['**/*.stories.tsx', '**/*.test.tsx'] }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        assetFileNames: 'index.css',
      },
    },
    cssCodeSplit: false,
  },
});

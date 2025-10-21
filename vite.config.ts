import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Build configuration
  build: {
    outDir: 'dist',
    target: ['es2022', 'edge89', 'firefox89', 'chrome89', 'safari15'],
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    },
    // Build performance
    chunkSizeWarningLimit: 1000
  },

  // Development server configuration
  server: {
    port: 3000,
    host: true,
    strictPort: false,
    open: false,
    hmr: {
      overlay: true
    }
  },

  // Path resolution for monorepo
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@packages': path.resolve(__dirname, './packages'),
      '@services': path.resolve(__dirname, './services'),
      '@apps': path.resolve(__dirname, './apps')
    }
  },

  // Optimization
  optimizeDeps: {
    include: ['react', 'react-dom']
  },

  // Preview server (for production builds)
  preview: {
    port: 4173,
    host: true,
    strictPort: false
  }
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This ensures process.env is available in the client for the AI SDK
    'process.env': process.env
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
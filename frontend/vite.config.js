import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3024,
    proxy: {
      '/api': {
        target: 'http://api.savewisezm.com:5024',
        changeOrigin: true
      }
    }
  }
});
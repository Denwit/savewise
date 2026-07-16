import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3024,
    proxy: {
      '/api': {
        target: 'https://savewise-mpzn.onrender.com',
        changeOrigin: true,
        secure: true
      }
    }
  }
});

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/proxy-gemini': {
            target: 'https://api.kie.ai',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/proxy-gemini/, ''),
            secure: true,
          },
          '/api/proxy': {
            target: 'https://api.kie.ai',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/proxy/, '/api/v1'),
            secure: true,
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

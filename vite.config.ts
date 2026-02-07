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
          '/api/proxy/gemini-3-flash': {
            target: 'https://api.kie.ai',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/proxy/, ''),
            secure: true,
          },
          '/api/proxy': {
            target: 'https://api.kie.ai',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/proxy/, '/api/v1'),
            secure: true,
          },
          '/api/pixazo/sdxl': {
            target: 'https://gateway.pixazo.ai',
            changeOrigin: true,
            rewrite: () => '/getImage/v1/getSDXLImage',
            secure: true,
          },
          '/api/pixazo/flux-schnell': {
            target: 'https://gateway.pixazo.ai',
            changeOrigin: true,
            rewrite: () => '/flux-1-schnell/v1/getData',
            secure: true,
          },
          '/api/pixazo/poll': {
            target: 'https://gateway.pixazo.ai',
            changeOrigin: true,
            rewrite: () => '/ai-model-api-polling/getGenerationResults',
            secure: true,
          },
          '/api/pixazo/inpaint': {
            target: 'https://gateway-stable-diffusion-v1-5-inpainting.appypie.workers.dev',
            changeOrigin: true,
            rewrite: () => '/getImage',
            secure: true,
          },
          '/api/pixazo/kling-motion-control': {
            target: 'https://gateway.pixazo.ai',
            changeOrigin: true,
            rewrite: () => '/kling-video-v2-6-standard-motion-control/v1/kling-video-v2-6-standard-motion-control-request',
            secure: true,
          },
          '/api/pixazo/kling-motion-control-result': {
            target: 'https://gateway.pixazo.ai',
            changeOrigin: true,
            rewrite: () => '/kling-video-v2-6-standard-motion-control/v1/kling-video-v2-6-standard-motion-control-request-result',
            secure: true,
          },
        }
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

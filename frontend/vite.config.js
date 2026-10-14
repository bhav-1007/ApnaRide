import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export default defineConfig(({ mode }) => {
  // Read .env at project root
  const env = { ...loadEnv(mode, root, ''), ...process.env };
  const target = `http://localhost:${env.PORT || 4000}`;

  return {
    plugins: [ react() ],
    server: {
      proxy: {
        '/api': target,
        '/socket.io': {
          target,
          ws: true,
        },
      },
    },
  };
});

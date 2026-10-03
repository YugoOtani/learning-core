import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    ...(mode === 'test' ? { fs: { allow: ['.', '../sample'] } } : {}),
  },
  test: {
    environment: 'jsdom',
  },
}));

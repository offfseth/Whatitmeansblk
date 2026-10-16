import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        atlas: fileURLToPath(new URL('./index.html', import.meta.url)),
        milestones: fileURLToPath(new URL('./milestones.html', import.meta.url)),
      },
    },
  },
});

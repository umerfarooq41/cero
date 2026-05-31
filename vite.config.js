import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function manualChunks(id) {
  if (!id.includes('node_modules')) return undefined;

  if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router-dom/')) {
    return 'vendor';
  }

  if (id.includes('/@tanstack/react-query/')) return 'query';
  if (id.includes('/framer-motion/')) return 'motion';
  if (id.includes('/recharts/')) return 'charts';
  if (id.includes('/@supabase/supabase-js/')) return 'supabase';
  if (id.includes('/@radix-ui/')) return 'ui';

  return 'vendor-misc';
}

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
});
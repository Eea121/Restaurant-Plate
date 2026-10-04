import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/TheRestaurantFrontEndCode/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (
            id.includes('recharts') ||
            id.includes('/d3-') ||
            id.includes('d3-')
          ) {
            return 'charts';
          }
          if (id.includes('@stripe') || id.includes('stripe-js')) {
            return 'stripe';
          }
          if (id.includes('@microsoft/signalr')) {
            return 'signalr';
          }
          if (id.includes('react-router')) {
            return 'router';
          }
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('scheduler')
          ) {
            return 'react-vendor';
          }
          return 'vendor';
        },
      },
    },
  },
})

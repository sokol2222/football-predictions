import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/football-predictions/',
  server: {
    port: 5173,
    strictPort: false,
    hmr: true  // Отключает HMR (горячую перезагрузку)
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@mui/material', '@supabase/supabase-js']
  }
})
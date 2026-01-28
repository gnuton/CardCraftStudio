/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vitest configuration has been moved to vitest.config.ts
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/CardCraftStudio/',
  server: {
  },
})

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',           // browser jaisa fake DOM, tests ke liye zaroori
    globals: true,                  // test/expect ko bina import kiye use kar sakte ho
    setupFiles: './src/test/setup.js'
  }
})
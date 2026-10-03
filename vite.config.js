import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// dashboardApi.test.js IST (Asia/Kolkata) maan kar likha hai; TZ fix na ho to dusre timezone me fail hota tha.
// eslint-disable-next-line no-undef
process.env.TZ = 'Asia/Kolkata'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',           // browser jaisa fake DOM, tests ke liye zaroori
    globals: true,                  // test/expect ko bina import kiye use kar sakte ho
    setupFiles: './src/test/setup.js'
  }
})
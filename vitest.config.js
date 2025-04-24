import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/setupTests.js',
        'cypress/**',
        'vite.config.js',
        'vitest.config.js',
      ],
      all: true,
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
})

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // Allow ts files in tests
    transformMode: { analytical: false },
  },
})

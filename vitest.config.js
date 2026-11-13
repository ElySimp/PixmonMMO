import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    passWithNoTests: true,
    include: ['tests/**/*.test.js'],
    // Sequential execution to prevent MongoDB Atlas state collision
    fileParallelism: false,
    pool: 'forks',
    maxConcurrency: 1,
    reporters: ['default'],
    env: {
      NODE_ENV: 'test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'frontend/', 'tests/'],
    },
  },
});

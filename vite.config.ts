/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/qtrace/',
  server: {
    port: 5173,
    open: true,
  },
  test: {
    // The analysis layer is pure functions over plain arrays - no DOM needed,
    // and Node 20 supplies CompressionStream for the gzip round-trip tests.
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        // Thin wrappers over the Supabase client - covered by integration, not
        // by unit tests that would only assert against a mock.
        'src/lib/supabase.ts',
        'src/lib/api/**',
      ],
    },
  },
});

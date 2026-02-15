import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Use happy-dom environment to provide DOM globals like document and window
        // It's often faster and has fewer ESM/CJS compatibility issues than jsdom
        environment: 'happy-dom',
        // Enable global test APIs (e.g., describe, it, expect)
        globals: true,
        // Include setup files for additional configuration
        setupFiles: ['./src/test/setup.ts'],
        include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    },
});

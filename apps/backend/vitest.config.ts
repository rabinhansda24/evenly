import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            thresholds: {
                global: {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
            },
        },
        include: [
            'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            'src/**/tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        ],
        exclude: [
            'node_modules',
            'dist',
            '.next',
            'coverage',
        ],
    },
});
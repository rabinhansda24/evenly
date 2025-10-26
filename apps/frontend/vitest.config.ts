import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.ts'],
        include: [
            'src/**/*.spec.{ts,tsx}',
            'src/**/tests/**/*.{spec,test}.{ts,tsx}',
            'app/**/tests/**/*.{spec,test}.{ts,tsx}'
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            lines: 80,
            branches: 80,
            functions: 80,
            statements: 80,
        },
    },
})

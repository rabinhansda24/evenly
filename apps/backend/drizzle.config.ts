import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.development' });

export default {
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.DATABASE_URL!,
    },
    verbose: true,
    strict: true,
} satisfies Config;
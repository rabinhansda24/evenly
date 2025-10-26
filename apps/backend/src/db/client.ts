import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import { config } from "dotenv";

// Load environment variables from .env files only in development
// In production (Coolify), environment variables are set directly
if (process.env.NODE_ENV !== 'production') {
    // First try to load .env.development if it exists, fall back to .env
    config({ path: '.env.development' });
    if (!process.env.DATABASE_URL) {
        config(); // fallback to .env
    }
}

export interface DatabaseConfig {
    connectionString: string;
    max?: number;
    idle_timeout?: number;
    connect_timeout?: number;
    // postgres-js SSL option: 'require' | true | { rejectUnauthorized?: boolean }
    ssl?: any;
}

export interface IDatabaseService {
    getDb(): ReturnType<typeof drizzle>;
    testConnection(): Promise<boolean>;
    close(): Promise<void>;
    healthCheck(): Promise<{ status: string; details?: any }>;
}

class DatabaseService implements IDatabaseService {
    private static instance: DatabaseService;
    private db: ReturnType<typeof drizzle>;
    private client: ReturnType<typeof postgres>;

    private constructor(dbConfig: DatabaseConfig) {
        // Create postgres client
        this.client = postgres(dbConfig.connectionString, {
            max: dbConfig.max || 20,
            idle_timeout: dbConfig.idle_timeout || 30,
            connect_timeout: dbConfig.connect_timeout || 10,
            ...(dbConfig.ssl ? { ssl: dbConfig.ssl } as any : {}),
        });

        // Create drizzle instance
        this.db = drizzle(this.client, { schema });
    }

    /**
     * Get singleton instance of database service
     */
    public static getInstance(dbConfig?: DatabaseConfig): DatabaseService {
        if (!DatabaseService.instance) {
            if (!dbConfig) {
                throw new Error("Database config required for first initialization");
            }
            DatabaseService.instance = new DatabaseService(dbConfig);
        }
        return DatabaseService.instance;
    }

    /**
     * Get drizzle database instance
     */
    public getDb() {
        return this.db;
    }

    /**
     * Test database connection
     */
    public async testConnection(): Promise<boolean> {
        try {
            const result = await this.client`SELECT 1 as test`;
            return result.length > 0 && result[0].test === 1;
        } catch (error) {
            console.error("Database connection test failed:", error);
            return false;
        }
    }

    /**
     * Close database connections
     */
    public async close(): Promise<void> {
        await this.client.end();
    }

    /**
     * Run database health check
     */
    public async healthCheck(): Promise<{ status: string; details?: any }> {
        try {
            const isConnected = await this.testConnection();

            if (isConnected) {
                return { status: "healthy" };
            } else {
                return { status: "unhealthy", details: "Connection test failed" };
            }
        } catch (error) {
            return {
                status: "unhealthy",
                details: error instanceof Error ? error.message : "Unknown error"
            };
        }
    }
}

// Factory function for dependency injection with retry logic
export async function createDatabaseService(dbConfig?: DatabaseConfig): Promise<IDatabaseService> {
    const envSsl = (process.env.DATABASE_SSL || process.env.DB_SSL || "").toLowerCase();
    const useSslEnv = envSsl === 'require' || envSsl === 'true' || envSsl === '1';

    // Prefer provided dbConfig.connectionString, else env
    const connectionString = dbConfig?.connectionString || process.env.DATABASE_URL || "";

    // Auto-detect SSL from URL query params like ?sslmode=require or ?ssl=true
    let useSslFromUrl = false;
    try {
        const u = new URL(connectionString);
        const sslmode = (u.searchParams.get('sslmode') || '').toLowerCase();
        const ssl = (u.searchParams.get('ssl') || '').toLowerCase();
        if (sslmode === 'require' || ssl === 'require' || ssl === 'true' || ssl === '1') {
            useSslFromUrl = true;
        }
    } catch {
        // ignore parse errors; some non-standard URLs may not parse cleanly
    }

    const config = dbConfig || {
        connectionString,
        max: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MAX) : undefined,
        idle_timeout: process.env.DB_IDLE_TIMEOUT ? Number(process.env.DB_IDLE_TIMEOUT) : undefined,
        connect_timeout: process.env.DB_CONNECT_TIMEOUT ? Number(process.env.DB_CONNECT_TIMEOUT) : 20,
        ssl: (useSslEnv || useSslFromUrl) ? 'require' : undefined,
    };

    if (!config.connectionString) {
        throw new Error("DATABASE_URL environment variable is required");
    }

    const dbService = DatabaseService.getInstance(config);

    // Test connection with retry logic for Docker startup
    const maxRetries = 10;
    const retryDelay = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Database connection attempt ${attempt}/${maxRetries}...`);
            const isConnected = await dbService.testConnection();
            if (isConnected) {
                console.log("✅ Database connection established successfully");
                return dbService;
            }
            throw new Error("Connection test failed");
        } catch (error: any) {
            if (error.code === '3D000') {
                throw new Error(`Database does not exist. Please create the database first or check your DATABASE_URL configuration. Original error: ${error.message}`);
            }

            if (attempt === maxRetries) {
                throw new Error(`Failed to establish database connection after ${maxRetries} attempts: ${error.message}`);
            }

            console.log(`⏳ Database connection failed (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }

    throw new Error("Database connection failed after all retry attempts");
}

// Export singleton getter for convenience
export function getDatabase(): IDatabaseService {
    return DatabaseService.getInstance();
}
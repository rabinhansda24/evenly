import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import { config } from "dotenv";

// Load environment variables from .env.development in development
// First try to load .env.development if it exists, fall back to .env
config({ path: '.env.development' });
if (!process.env.DATABASE_URL) {
    config(); // fallback to .env
}

export interface DatabaseConfig {
    connectionString: string;
    max?: number;
    idle_timeout?: number;
    connect_timeout?: number;
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

// Factory function for dependency injection
export async function createDatabaseService(dbConfig?: DatabaseConfig): Promise<IDatabaseService> {
    const config = dbConfig || {
        connectionString: process.env.DATABASE_URL || ""
    };

    if (!config.connectionString) {
        throw new Error("DATABASE_URL environment variable is required");
    }

    const dbService = DatabaseService.getInstance(config);

    // Test connection on creation with better error handling
    try {
        const isConnected = await dbService.testConnection();
        if (!isConnected) {
            throw new Error("Database connection test failed");
        }
    } catch (error: any) {
        if (error.code === '3D000') {
            throw new Error(`Database does not exist. Please create the database first or check your DATABASE_URL configuration. Original error: ${error.message}`);
        }
        throw new Error(`Failed to establish database connection: ${error.message}`);
    }

    return dbService;
}

// Export singleton getter for convenience
export function getDatabase(): IDatabaseService {
    return DatabaseService.getInstance();
}
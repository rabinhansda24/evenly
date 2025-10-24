import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabaseService } from "./client.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MigrationService {
    /**
     * Run pending migrations
     */
    public static async runMigrations(): Promise<void> {
        console.log("🔄 Starting database migrations...");

        try {
            const dbService = await createDatabaseService();
            const db = dbService.getDb();

            // Path to migrations folder
            const migrationsFolder = path.join(__dirname, "migrations");

            await migrate(db, { migrationsFolder });

            console.log("✅ Database migrations completed successfully");
        } catch (error) {
            console.error("❌ Migration failed:", error);
            throw error;
        }
    }

    /**
     * Initialize database with migrations on startup
     */
    public static async initializeWithMigrations(): Promise<void> {
        try {
            await this.runMigrations();
            console.log("✅ Database initialized with migrations");
        } catch (error) {
            console.error("❌ Database initialization failed:", error);
            throw error;
        }
    }
}

// CLI script for running migrations
if (import.meta.url === `file://${process.argv[1]}`) {
    MigrationService.runMigrations()
        .then(() => {
            console.log("Migrations completed successfully");
            process.exit(0);
        })
        .catch((error) => {
            console.error("Migration failed:", error);
            process.exit(1);
        });
}
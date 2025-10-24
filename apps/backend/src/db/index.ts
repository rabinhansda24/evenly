// Database client and service
export { createDatabaseService, getDatabase, type DatabaseConfig } from "./client.js";

// Schema exports
export * from "./schema.js";

// Migration service
export { MigrationService } from "./migrations.js";

// Database connection initialization utility with migrations
export async function initializeDatabase() {
    const { createDatabaseService } = await import("./client.js");
    const { MigrationService } = await import("./migrations.js");

    try {
        // First establish connection
        const dbService = await createDatabaseService();
        console.log("✅ Database connection established successfully");

        // Then run migrations
        await MigrationService.runMigrations();
        console.log("✅ Database migrations completed");

        return dbService;
    } catch (error) {
        console.error("❌ Failed to initialize database:", error);
        throw error;
    }
}
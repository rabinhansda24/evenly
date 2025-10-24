import { createDatabaseService } from "./src/db/client.js";
import { config } from "dotenv";
import path from "path";

// Load environment variables from the correct file
config({ path: path.join(process.cwd(), '.env.development') });

async function testDatabaseConnection() {
    try {
        console.log("🔄 Testing database connection...");
        console.log("Database URL:", process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@'));

        const dbService = await createDatabaseService();
        const isConnected = await dbService.testConnection();

        if (isConnected) {
            console.log("✅ Database connection successful!");
        } else {
            console.log("❌ Database connection failed");
        }

        await dbService.close();
    } catch (error) {
        console.error("❌ Database connection error:", error);
    }
}

testDatabaseConnection();
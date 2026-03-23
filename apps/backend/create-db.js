import postgres from "postgres";
import { config } from "dotenv";
import path from "path";

// Load environment variables
config({ path: path.join(process.cwd(), '.env.development') });

async function createDatabase() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error("DATABASE_URL environment variable is required");
    }

    // Parse the URL to get connection details
    const url = new URL(databaseUrl);
    const dbName = url.pathname.slice(1); // Remove the leading '/'

    // Connect to postgres database (default) to create our database
    const adminConnectionString = databaseUrl.replace(`/${dbName}`, '/postgres');

    console.log(`🔄 Creating database "${dbName}"...`);

    try {
        // Connect to postgres database
        const sql = postgres(adminConnectionString, { max: 1 });

        // Check if database exists
        const databases = await sql`
      SELECT datname FROM pg_database WHERE datname = ${dbName}
    `;

        if (databases.length > 0) {
            console.log(`✅ Database "${dbName}" already exists`);
        } else {
            // Create the database
            await sql.unsafe(`CREATE DATABASE "${dbName}"`);
            console.log(`✅ Database "${dbName}" created successfully`);
        }

        await sql.end();
    } catch (error) {
        console.error(`❌ Failed to create database "${dbName}":`, error);
        throw error;
    }
}

createDatabase().catch(console.error);
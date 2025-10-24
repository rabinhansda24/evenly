import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { router as authRouter } from "./modules/auth/http/auth.routes.js";
import { initializeDatabase, getDatabase } from "./db/index.js";
import { config } from "dotenv";

// Load environment variables from .env.development in development
// First try to load .env.development if it exists, fall back to .env
config({ path: '.env.development' });
if (!process.env.DATABASE_URL) {
    config(); // fallback to .env
}

const app: Application = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Enhanced health check with database status
app.get("/health", async (_req, res) => {
    try {
        const dbService = getDatabase();
        const dbHealth = await dbService.healthCheck();

        res.json({
            status: "ok",
            timestamp: new Date().toISOString(),
            database: dbHealth.status,
            ...(dbHealth.details && { dbDetails: dbHealth.details })
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            timestamp: new Date().toISOString(),
            database: "unavailable",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

app.use("/api/auth", authRouter);

// Global error handler
app.use((error: any, _req: any, res: any, _next: any) => {
    console.error("Unhandled error:", error);
    res.status(500).json({
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? error.message : "Something went wrong"
    });
});

const port = process.env.PORT || 4000;

// Initialize database and start server
async function startServer() {
    try {
        console.log("🚀 Starting Evenly backend...");

        // Initialize database with migrations
        await initializeDatabase();

        // Start HTTP server
        app.listen(port, () => {
            console.log(`✅ Evenly backend listening on :${port}`);
            console.log(`🌍 Health check available at http://localhost:${port}/health`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}

startServer();

export default app;

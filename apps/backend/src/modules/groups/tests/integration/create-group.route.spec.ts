import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../../server.js";
import { getDatabase, groupMembers } from "../../../../db/index.js";
import { eq } from "drizzle-orm";

function uniqueEmail() {
    return `grp_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
}

describe("POST /api/groups", () => {
    it("requires auth", async () => {
        const res = await request(app).post("/api/groups").send({ name: "Unauthed" });
        expect(res.status).toBe(401);
    });

    it("creates a group and sets owner membership for creator", async () => {
        const email = uniqueEmail();
        const password = "Password123!";
        const name = "Owner";

        // Register and login to get session cookie via agent
        const agent = request.agent(app);
        const reg = await agent.post("/api/auth/register").send({ email, name, password });
        expect(reg.status).toBe(201);

        const login = await agent.post("/api/auth/login").send({ email, password });
        expect(login.status).toBe(200);

        // Create group
        const payload = { name: "Trip to Goa", description: "Friends trip" };
        const create = await agent.post("/api/groups").send(payload);
        expect(create.status).toBe(201);

        // Response body should include group info and createdById
        expect(create.body).toHaveProperty("id");
        expect(create.body).toMatchObject({
            name: payload.name,
            description: payload.description,
            createdById: expect.any(String),
        });

        const groupId = create.body.id as string;
        const userId = create.body.createdById as string;

        // Verify membership owner in DB
        const db = getDatabase().getDb();
        const memberships = await db
            .select()
            .from(groupMembers)
            .where(eq(groupMembers.groupId as any, groupId))
            .limit(10);

        expect(memberships.some((m: any) => m.userId === userId && m.role === "owner")).toBe(true);
    });
});

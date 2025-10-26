import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../../server.js";

describe("POST /api/auth/logout", () => {
    it("clears session cookie and /me returns 401 afterwards", async () => {
        const unique = Math.random().toString(36).slice(2);
        const email = `logout+${unique}@example.com`;
        const password = "Password123!";
        const name = "Logout Test";

        // Register and login
        const reg = await request(app).post("/api/auth/register").send({ email, name, password });
        expect(reg.status).toBe(201);

        const agent = request.agent(app);
        const login = await agent.post("/api/auth/login").send({ email, password });
        expect(login.status).toBe(200);

        // Logout
        const logout = await agent.post("/api/auth/logout").send();
        expect([200, 204]).toContain(logout.status);

        // Access protected route should now fail
        const me = await agent.get("/api/auth/me");
        expect(me.status).toBe(401);
    });

    it("is idempotent when no cookie (returns 204)", async () => {
        const res = await request(app).post("/api/auth/logout").send();
        expect([200, 204]).toContain(res.status);
    });
});

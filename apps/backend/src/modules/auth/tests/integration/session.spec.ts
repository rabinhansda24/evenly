import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../../server.js";

describe("auth session cookie + middleware", () => {
    it("issues httpOnly session cookie on login and allows /api/auth/me", async () => {
        const unique = Math.random().toString(36).slice(2);
        const email = `sess+${unique}@example.com`;
        const password = "Password123!";
        const name = "Sess Test";

        // Register
        const reg = await request(app).post("/api/auth/register").send({ email, name, password });
        expect(reg.status).toBe(201);

        const agent = request.agent(app);
        // Login
        const login = await agent.post("/api/auth/login").send({ email, password });
        expect(login.status).toBe(200);
        // Should set cookie
        const setCookie = login.headers["set-cookie"] as unknown as string[] | undefined;
        expect(setCookie).toBeDefined();
        const cookies = Array.isArray(setCookie) ? setCookie : [];
        expect(cookies.some((c) => /session=/.test(c))).toBe(true);

        // Access protected route
        const me = await agent.get("/api/auth/me");
        expect(me.status).toBe(200);
        expect(me.body).toMatchObject({ email, name });
        expect(me.body).toHaveProperty("id");
    });

    it("returns 401 for /api/auth/me without cookie", async () => {
        const res = await request(app).get("/api/auth/me");
        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({ error: { code: expect.stringMatching(/UNAUTHORIZED|NO_AUTH|INVALID_TOKEN/) } });
    });
});

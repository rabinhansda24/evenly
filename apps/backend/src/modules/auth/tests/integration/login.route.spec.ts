import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../../server.js";

describe("POST /api/auth/login", () => {
    it("returns 200 and public user on valid credentials", async () => {
        const unique = Math.random().toString(36).slice(2);
        const email = `login+${unique}@example.com`;
        const password = "Password123!";
        const name = "Login Test";

        // First register the user
        const reg = await request(app).post("/api/auth/register").send({ email, name, password });
        expect(reg.status).toBe(201);

        // Now login with same credentials
        const res = await request(app).post("/api/auth/login").send({ email, password });
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ email, name });
        expect(res.body).toHaveProperty("id");
        expect(res.body.password).toBeUndefined();
        expect(res.body.passwordHash).toBeUndefined();
    });

    it("returns 401 on invalid credentials", async () => {
        const unique = Math.random().toString(36).slice(2);
        const email = `invalid+${unique}@example.com`;
        const password = "Password123!";
        const name = "Invalid Test";

        // Register the user
        const reg = await request(app).post("/api/auth/register").send({ email, name, password });
        expect(reg.status).toBe(201);

        // Attempt login with wrong password
        const res = await request(app).post("/api/auth/login").send({ email, password: "WrongPass!" });
        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({ error: { code: expect.stringMatching(/INVALID_CREDENTIALS|UNAUTHORIZED/) } });
    });
});

import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../../server.js";

describe("POST /api/auth/register duplicate handling", () => {
    it("returns 409 when the email is already registered", async () => {
        const unique = Math.random().toString(36).slice(2);
        const payload = { email: `dup+${unique}@example.com`, name: "Dup", password: "Password123!" };

        const first = await request(app).post("/api/auth/register").send(payload);
        expect(first.status).toBe(201);

        const second = await request(app).post("/api/auth/register").send(payload);
        expect(second.status).toBe(409);
        expect(second.body).toMatchObject({ error: { code: expect.stringMatching(/USER_EXISTS|CONFLICT/) } });
    });
});

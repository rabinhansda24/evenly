import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../../server.js";

describe("POST /api/auth/register", () => {
  it("returns 400 for invalid payload", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "bad", name: "x", password: "short" });
    expect(res.status).toBe(400);
  });

  it("returns 201 for valid payload (stub)", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "a@b.com", name: "Alice", password: "password1" });
    expect(res.status).toBe(201);
  });
});

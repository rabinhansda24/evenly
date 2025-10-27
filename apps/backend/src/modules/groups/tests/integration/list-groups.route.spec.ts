import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../../server.js";

function uniqueEmail() {
    return `list_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
}

describe("GET /api/groups (list current user's groups)", () => {
    it("requires auth", async () => {
        const res = await request(app).get("/api/groups");
        expect(res.status).toBe(401);
    });

    it("returns only groups the current user is a member of", async () => {
        const user1 = { email: uniqueEmail(), name: "U1", password: "Password123!" };
        const user2 = { email: uniqueEmail(), name: "U2", password: "Password123!" };

        // User1: register, login, create 2 groups
        const agent1 = request.agent(app);
        const reg1 = await agent1.post("/api/auth/register").send(user1);
        expect(reg1.status).toBe(201);
        const login1 = await agent1.post("/api/auth/login").send({ email: user1.email, password: user1.password });
        expect(login1.status).toBe(200);

        const g1 = await agent1.post("/api/groups").send({ name: "U1-G1", description: "g1" });
        expect(g1.status).toBe(201);
        const g2 = await agent1.post("/api/groups").send({ name: "U1-G2", description: "g2" });
        expect(g2.status).toBe(201);

        // User2: register, login, create 1 group
        const agent2 = request.agent(app);
        const reg2 = await agent2.post("/api/auth/register").send(user2);
        expect(reg2.status).toBe(201);
        const login2 = await agent2.post("/api/auth/login").send({ email: user2.email, password: user2.password });
        expect(login2.status).toBe(200);
        const g3 = await agent2.post("/api/groups").send({ name: "U2-G1", description: "g3" });
        expect(g3.status).toBe(201);

        // List as user1
        const list1 = await agent1.get("/api/groups");
        expect(list1.status).toBe(200);
        expect(Array.isArray(list1.body)).toBe(true);
        const names1 = list1.body.map((g: any) => g.name).sort();
        expect(names1).toEqual(["U1-G1", "U1-G2"]);

        // List as user2
        const list2 = await agent2.get("/api/groups");
        expect(list2.status).toBe(200);
        const names2 = list2.body.map((g: any) => g.name).sort();
        expect(names2).toEqual(["U2-G1"]);
    }, 20000);
});

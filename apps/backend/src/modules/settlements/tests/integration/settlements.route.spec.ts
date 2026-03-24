import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../../server.js";

function uid() {
    return `set_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

async function setupUserAndGroup(name: string) {
    const email = `${uid()}@example.com`;
    const password = "Password123!";
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send({ email, name, password });
    await agent.post("/api/auth/login").send({ email, password });
    const grp = await agent.post("/api/groups").send({ name: "Test Group", description: "test" });
    expect(grp.status).toBe(201);
    return { agent, groupId: grp.body.id as string, userId: grp.body.createdById as string };
}

describe("GET /api/groups/:groupId/balances", () => {
    it("requires authentication", async () => {
        const res = await request(app).get("/api/groups/some-id/balances");
        expect(res.status).toBe(401);
    });

    it("returns 404 for a group the user is not a member of", async () => {
        const { agent } = await setupUserAndGroup("Alice");
        const res = await agent.get("/api/groups/00000000-0000-0000-0000-000000000000/balances");
        expect(res.status).toBe(404);
    });

    it("returns zero balances for a group with no expenses", async () => {
        const { agent, groupId } = await setupUserAndGroup("Alice");
        const res = await agent.get(`/api/groups/${groupId}/balances`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        // Group has 1 member (owner), balance should be 0
        expect(res.body[0]).toMatchObject({ balance: 0 });
    });

    it("reflects correct balances after an expense is added", async () => {
        const { agent: ownerAgent, groupId, userId: ownerId } = await setupUserAndGroup("Alice");

        // Add a second member
        const memberEmail = `${uid()}@example.com`;
        const password = "Password123!";
        const memberAgent = request.agent(app);
        const reg = await memberAgent.post("/api/auth/register").send({ email: memberEmail, name: "Bob", password });
        expect(reg.status).toBe(201);
        await memberAgent.post("/api/auth/login").send({ email: memberEmail, password });
        const meRes = await memberAgent.get("/api/auth/me");
        expect(meRes.status).toBe(200);
        const memberId = meRes.body.id as string;

        const addMember = await ownerAgent.post(`/api/groups/${groupId}/members`).send({ email: memberEmail });
        expect(addMember.status).toBe(201);

        // Alice pays $60, both share equally
        const exp = await ownerAgent.post(`/api/groups/${groupId}/expenses`).send({
            description: "Dinner",
            amount: 60,
            paidById: ownerId,
            splitMode: "equal",
            participants: [{ userId: ownerId }, { userId: memberId }],
        });
        expect(exp.status).toBe(201);

        const balances = await ownerAgent.get(`/api/groups/${groupId}/balances`);
        expect(balances.status).toBe(200);

        const aliceBalance = balances.body.find((b: any) => b.userId === ownerId);
        const bobBalance = balances.body.find((b: any) => b.userId === memberId);

        expect(aliceBalance.balance).toBe(30);   // paid 60, owes 30 → +30
        expect(bobBalance.balance).toBe(-30);     // paid 0, owes 30 → -30
    });
}, 30000);

describe("GET /api/groups/:groupId/settlements", () => {
    it("requires authentication", async () => {
        const res = await request(app).get("/api/groups/some-id/settlements");
        expect(res.status).toBe(401);
    });

    it("returns 404 for a group the user is not a member of", async () => {
        const { agent } = await setupUserAndGroup("Alice");
        const res = await agent.get("/api/groups/00000000-0000-0000-0000-000000000000/settlements");
        expect(res.status).toBe(404);
    });

    it("returns empty array for a group with no settlements", async () => {
        const { agent, groupId } = await setupUserAndGroup("Alice");
        const res = await agent.get(`/api/groups/${groupId}/settlements`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(0);
    });
}, 20000);

describe("POST /api/groups/:groupId/settlements", () => {
    it("requires authentication", async () => {
        const res = await request(app).post("/api/groups/some-id/settlements").send({});
        expect(res.status).toBe(401);
    });

    it("returns 400 on invalid payload", async () => {
        const { agent, groupId } = await setupUserAndGroup("Alice");
        const res = await agent.post(`/api/groups/${groupId}/settlements`).send({});
        expect(res.status).toBe(400);
    });

    it("creates a settlement and it appears in the list", async () => {
        const { agent: ownerAgent, groupId, userId: ownerId } = await setupUserAndGroup("Alice");

        // Register Bob and add him to the group
        const memberEmail = `${uid()}@example.com`;
        const password = "Password123!";
        const memberAgent = request.agent(app);
        await memberAgent.post("/api/auth/register").send({ email: memberEmail, name: "Bob", password });
        await memberAgent.post("/api/auth/login").send({ email: memberEmail, password });
        const meRes = await memberAgent.get("/api/auth/me");
        const memberId = meRes.body.id as string;
        await ownerAgent.post(`/api/groups/${groupId}/members`).send({ email: memberEmail });

        // Bob records a settlement to Alice
        const create = await memberAgent.post(`/api/groups/${groupId}/settlements`).send({
            toUserId: ownerId,
            amount: 25,
            description: "Settling up",
        });
        expect(create.status).toBe(201);
        expect(create.body).toHaveProperty("id");
        expect(create.body).toMatchObject({
            fromUserId: memberId,
            toUserId: ownerId,
        });

        // Verify it shows up in the list
        const list = await ownerAgent.get(`/api/groups/${groupId}/settlements`);
        expect(list.status).toBe(200);
        expect(list.body.some((s: any) => s.id === create.body.id)).toBe(true);
    });

    it("returns 404 for a group the user is not a member of", async () => {
        const { agent, userId } = await setupUserAndGroup("Alice");
        const res = await agent.post("/api/groups/00000000-0000-0000-0000-000000000000/settlements").send({
            toUserId: userId,
            amount: 10,
        });
        expect(res.status).toBe(404);
    });
}, 30000);

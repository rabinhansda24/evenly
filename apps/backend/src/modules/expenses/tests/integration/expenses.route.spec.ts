import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../../server.js";

function uid() {
    return `exp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

async function setupUserAndGroup(name: string) {
    const email = `${uid()}@example.com`;
    const password = "Password123!";
    const agent = request.agent(app);
    const reg = await agent.post("/api/auth/register").send({ email, name, password });
    expect(reg.status).toBe(201);
    const login = await agent.post("/api/auth/login").send({ email, password });
    expect(login.status).toBe(200);
    const grp = await agent.post("/api/groups").send({ name: "Test Group", description: "test" });
    expect(grp.status).toBe(201);
    return { agent, groupId: grp.body.id as string, userId: grp.body.createdById as string };
}

describe("GET /api/groups/:groupId/expenses", () => {
    it("requires authentication", async () => {
        const res = await request(app).get("/api/groups/some-group-id/expenses");
        expect(res.status).toBe(401);
    });

    it("returns 404 for a group the user is not a member of", async () => {
        const { agent } = await setupUserAndGroup("Alice");
        const res = await agent.get("/api/groups/00000000-0000-0000-0000-000000000000/expenses");
        expect(res.status).toBe(404);
    });

    it("returns an empty array when the group has no expenses", async () => {
        const { agent, groupId } = await setupUserAndGroup("Alice");
        const res = await agent.get(`/api/groups/${groupId}/expenses`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(0);
    });
}, 20000);

describe("POST /api/groups/:groupId/expenses", () => {
    it("requires authentication", async () => {
        const res = await request(app)
            .post("/api/groups/some-group-id/expenses")
            .send({ description: "Lunch", amount: 10, paidById: "some-uuid", participants: [] });
        expect(res.status).toBe(401);
    });

    it("returns 400 on invalid payload (missing required fields)", async () => {
        const { agent, groupId } = await setupUserAndGroup("Alice");
        const res = await agent.post(`/api/groups/${groupId}/expenses`).send({});
        expect(res.status).toBe(400);
    });

    it("creates an expense and returns it with id", async () => {
        const { agent, groupId, userId } = await setupUserAndGroup("Alice");

        const payload = {
            description: "Team lunch",
            amount: 60,
            paidById: userId,
            splitMode: "equal",
            participants: [{ userId }],
        };

        const res = await agent.post(`/api/groups/${groupId}/expenses`).send(payload);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("id");
        expect(res.body).toMatchObject({
            description: "Team lunch",
        });
    });

    it("created expense appears in list", async () => {
        const { agent, groupId, userId } = await setupUserAndGroup("Alice");

        const payload = {
            description: "Groceries",
            amount: 45,
            paidById: userId,
            participants: [{ userId }],
        };

        const create = await agent.post(`/api/groups/${groupId}/expenses`).send(payload);
        expect(create.status).toBe(201);

        const list = await agent.get(`/api/groups/${groupId}/expenses`);
        expect(list.status).toBe(200);
        expect(list.body.some((e: any) => e.description === "Groceries")).toBe(true);
    });

    it("returns 404 for a group the user is not a member of", async () => {
        const { agent, userId } = await setupUserAndGroup("Alice");
        const res = await agent.post("/api/groups/00000000-0000-0000-0000-000000000000/expenses").send({
            description: "Lunch",
            amount: 10,
            paidById: userId,
            participants: [{ userId }],
        });
        expect(res.status).toBe(404);
    });
}, 30000);

describe("DELETE /api/groups/:groupId/expenses/:expenseId", () => {
    it("requires authentication", async () => {
        const res = await request(app).delete("/api/groups/g1/expenses/e1");
        expect(res.status).toBe(401);
    });

    it("returns 404 for an expense that does not exist", async () => {
        const { agent, groupId } = await setupUserAndGroup("Alice");
        const res = await agent.delete(
            `/api/groups/${groupId}/expenses/00000000-0000-0000-0000-000000000000`
        );
        expect(res.status).toBe(404);
    });

    it("payer can delete their own expense", async () => {
        const { agent, groupId, userId } = await setupUserAndGroup("Alice");

        const created = await agent.post(`/api/groups/${groupId}/expenses`).send({
            description: "Dinner",
            amount: 80,
            paidById: userId,
            participants: [{ userId }],
        });
        expect(created.status).toBe(201);

        const del = await agent.delete(`/api/groups/${groupId}/expenses/${created.body.id}`);
        expect(del.status).toBe(204);

        // Verify it's gone
        const list = await agent.get(`/api/groups/${groupId}/expenses`);
        expect(list.body.some((e: any) => e.id === created.body.id)).toBe(false);
    });

    it("non-payer who is not owner gets 404 (existence hidden)", async () => {
        // Owner creates expense
        const { agent: ownerAgent, groupId, userId: ownerId } = await setupUserAndGroup("Alice");

        // Member joins the group
        const memberEmail = `${uid()}@example.com`;
        const password = "Password123!";
        const memberAgent = request.agent(app);
        await memberAgent.post("/api/auth/register").send({ email: memberEmail, name: "Bob", password });
        await memberAgent.post("/api/auth/login").send({ email: memberEmail, password });
        await ownerAgent.post(`/api/groups/${groupId}/members`).send({ email: memberEmail });

        const created = await ownerAgent.post(`/api/groups/${groupId}/expenses`).send({
            description: "Dinner",
            amount: 80,
            paidById: ownerId,
            participants: [{ userId: ownerId }],
        });
        expect(created.status).toBe(201);

        const del = await memberAgent.delete(`/api/groups/${groupId}/expenses/${created.body.id}`);
        expect(del.status).toBe(404);
    });
}, 30000);

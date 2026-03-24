import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../../server.js";

function uid() {
    return `mem_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

async function setupOwnerAndGroup() {
    const email = `${uid()}@example.com`;
    const password = "Password123!";
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send({ email, name: "Owner", password });
    await agent.post("/api/auth/login").send({ email, password });
    const grp = await agent.post("/api/groups").send({ name: "Test Group", description: "test" });
    expect(grp.status).toBe(201);
    return { agent, groupId: grp.body.id as string, userId: grp.body.createdById as string };
}

async function registerUser(name: string) {
    const email = `${uid()}@example.com`;
    const password = "Password123!";
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send({ email, name, password });
    await agent.post("/api/auth/login").send({ email, password });
    const me = await agent.get("/api/auth/me");
    return { agent, email, userId: me.body.id as string };
}

// ── POST /api/groups/:id/members ──────────────────────────────────────────────
describe("POST /api/groups/:id/members — add member by email", () => {
    it("requires authentication", async () => {
        const res = await request(app)
            .post("/api/groups/some-id/members")
            .send({ email: "x@example.com" });
        expect(res.status).toBe(401);
    });

    it("adds a registered user to the group", async () => {
        const { agent: ownerAgent, groupId } = await setupOwnerAndGroup();
        const { email: memberEmail } = await registerUser("Bob");

        const res = await ownerAgent
            .post(`/api/groups/${groupId}/members`)
            .send({ email: memberEmail });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ email: memberEmail });
    });

    it("returns 400 when email is not a valid email address", async () => {
        const { agent, groupId } = await setupOwnerAndGroup();
        const res = await agent.post(`/api/groups/${groupId}/members`).send({ email: "not-an-email" });
        expect(res.status).toBe(400);
    });

    it("returns 403 when a non-owner tries to add a member", async () => {
        const { agent: ownerAgent, groupId } = await setupOwnerAndGroup();
        const { agent: memberAgent, email: memberEmail } = await registerUser("Bob");
        const { email: thirdEmail } = await registerUser("Charlie");

        // Add Bob as a member first
        await ownerAgent.post(`/api/groups/${groupId}/members`).send({ email: memberEmail });

        // Bob (non-owner) tries to add Charlie
        const res = await memberAgent
            .post(`/api/groups/${groupId}/members`)
            .send({ email: thirdEmail });
        expect(res.status).toBe(403);
    });

    it("returns 404 when the target email is not registered", async () => {
        const { agent, groupId } = await setupOwnerAndGroup();
        const res = await agent
            .post(`/api/groups/${groupId}/members`)
            .send({ email: "nobody@example.com" });
        expect(res.status).toBe(404);
    });

    it("returns 409 when the user is already a member", async () => {
        const { agent: ownerAgent, groupId } = await setupOwnerAndGroup();
        const { email: memberEmail } = await registerUser("Bob");

        await ownerAgent.post(`/api/groups/${groupId}/members`).send({ email: memberEmail });
        const res = await ownerAgent.post(`/api/groups/${groupId}/members`).send({ email: memberEmail });
        expect(res.status).toBe(409);
    });

    it("returns 404 for a group the requester is not a member of", async () => {
        const { agent } = await setupOwnerAndGroup();
        const res = await agent
            .post("/api/groups/00000000-0000-0000-0000-000000000000/members")
            .send({ email: "anyone@example.com" });
        expect(res.status).toBe(404);
    });
}, 30000);

// ── DELETE /api/groups/:id/members/:userId ────────────────────────────────────
describe("DELETE /api/groups/:id/members/:userId — remove member", () => {
    it("requires authentication", async () => {
        const res = await request(app).delete("/api/groups/some-id/members/some-user");
        expect(res.status).toBe(401);
    });

    it("owner can remove a member", async () => {
        const { agent: ownerAgent, groupId } = await setupOwnerAndGroup();
        const { email: memberEmail, userId: memberId } = await registerUser("Bob");

        await ownerAgent.post(`/api/groups/${groupId}/members`).send({ email: memberEmail });

        const res = await ownerAgent.delete(`/api/groups/${groupId}/members/${memberId}`);
        expect(res.status).toBe(204);
    });

    it("a member can remove themselves (self-removal)", async () => {
        const { agent: ownerAgent, groupId } = await setupOwnerAndGroup();
        const { agent: memberAgent, email: memberEmail, userId: memberId } = await registerUser("Bob");

        await ownerAgent.post(`/api/groups/${groupId}/members`).send({ email: memberEmail });

        const res = await memberAgent.delete(`/api/groups/${groupId}/members/${memberId}`);
        expect(res.status).toBe(204);
    });

    it("non-owner cannot remove another member", async () => {
        const { agent: ownerAgent, groupId } = await setupOwnerAndGroup();
        const { agent: bobAgent, email: bobEmail } = await registerUser("Bob");
        const { email: charlieEmail, userId: charlieId } = await registerUser("Charlie");

        await ownerAgent.post(`/api/groups/${groupId}/members`).send({ email: bobEmail });
        await ownerAgent.post(`/api/groups/${groupId}/members`).send({ email: charlieEmail });

        const res = await bobAgent.delete(`/api/groups/${groupId}/members/${charlieId}`);
        expect(res.status).toBe(403);
    });

    it("returns 400 when attempting to remove the group owner", async () => {
        const { agent: ownerAgent, groupId, userId: ownerId } = await setupOwnerAndGroup();
        const res = await ownerAgent.delete(`/api/groups/${groupId}/members/${ownerId}`);
        expect(res.status).toBe(400);
    });

    it("returns 404 for a user who is not a member", async () => {
        const { agent, groupId } = await setupOwnerAndGroup();
        const res = await agent.delete(
            `/api/groups/${groupId}/members/00000000-0000-0000-0000-000000000000`
        );
        expect(res.status).toBe(404);
    });
}, 30000);

// ── POST /api/groups/:id/invite ───────────────────────────────────────────────
describe("POST /api/groups/:id/invite — generate invite token", () => {
    it("requires authentication", async () => {
        const res = await request(app).post("/api/groups/some-id/invite");
        expect(res.status).toBe(401);
    });

    it("owner receives an invite token", async () => {
        const { agent, groupId } = await setupOwnerAndGroup();
        const res = await agent.post(`/api/groups/${groupId}/invite`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("token");
        expect(typeof res.body.token).toBe("string");
        expect(res.body.token.length).toBeGreaterThan(0);
    });

    it("returns the same token on repeated calls (idempotent)", async () => {
        const { agent, groupId } = await setupOwnerAndGroup();
        const first = await agent.post(`/api/groups/${groupId}/invite`);
        const second = await agent.post(`/api/groups/${groupId}/invite`);
        expect(first.body.token).toBe(second.body.token);
    });

    it("returns 403 when a non-owner requests an invite token", async () => {
        const { agent: ownerAgent, groupId } = await setupOwnerAndGroup();
        const { agent: memberAgent, email: memberEmail } = await registerUser("Bob");

        await ownerAgent.post(`/api/groups/${groupId}/members`).send({ email: memberEmail });

        const res = await memberAgent.post(`/api/groups/${groupId}/invite`);
        expect(res.status).toBe(403);
    });

    it("returns 404 for a group the user is not in", async () => {
        const { agent } = await setupOwnerAndGroup();
        const res = await agent.post("/api/groups/00000000-0000-0000-0000-000000000000/invite");
        expect(res.status).toBe(404);
    });
}, 30000);

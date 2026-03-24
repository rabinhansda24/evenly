import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../../server.js";

function uid() {
    return `inv_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

async function setupOwnerWithGroup() {
    const email = `${uid()}@example.com`;
    const password = "Password123!";
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send({ email, name: "Owner", password });
    await agent.post("/api/auth/login").send({ email, password });
    const grp = await agent.post("/api/groups").send({ name: "Invite Group", description: "desc" });
    expect(grp.status).toBe(201);
    const inv = await agent.post(`/api/groups/${grp.body.id}/invite`);
    expect(inv.status).toBe(200);
    return {
        agent,
        groupId: grp.body.id as string,
        groupName: grp.body.name as string,
        token: inv.body.token as string,
    };
}

async function registerAndLoginUser(name: string) {
    const email = `${uid()}@example.com`;
    const password = "Password123!";
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send({ email, name, password });
    await agent.post("/api/auth/login").send({ email, password });
    return { agent };
}

// ── GET /api/invites/:token (public) ─────────────────────────────────────────
describe("GET /api/invites/:token — public invite info", () => {
    it("returns group info for a valid token (no auth required)", async () => {
        const { token, groupName } = await setupOwnerWithGroup();

        const res = await request(app).get(`/api/invites/${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ name: groupName });
        expect(res.body).toHaveProperty("id");
    });

    it("returns 404 for an invalid or unknown token", async () => {
        const res = await request(app).get("/api/invites/totally_invalid_token_xyz");
        expect(res.status).toBe(404);
        expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("does not include sensitive fields like inviteToken in the response", async () => {
        const { token } = await setupOwnerWithGroup();
        const res = await request(app).get(`/api/invites/${token}`);
        expect(res.status).toBe(200);
        expect(res.body).not.toHaveProperty("inviteToken");
        expect(res.body).not.toHaveProperty("createdById");
    });
}, 20000);

// ── POST /api/invites/:token/join (authenticated) ────────────────────────────
describe("POST /api/invites/:token/join — join group via invite", () => {
    it("requires authentication", async () => {
        const res = await request(app).post("/api/invites/some-token/join");
        expect(res.status).toBe(401);
    });

    it("authenticated user can join a group via invite token", async () => {
        const { token, groupId } = await setupOwnerWithGroup();
        const { agent: guestAgent } = await registerAndLoginUser("Guest");

        const res = await guestAgent.post(`/api/invites/${token}/join`);
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ groupId, alreadyMember: false });
    });

    it("joining again is idempotent (returns alreadyMember: true with 200)", async () => {
        const { token } = await setupOwnerWithGroup();
        const { agent: guestAgent } = await registerAndLoginUser("Guest");

        await guestAgent.post(`/api/invites/${token}/join`);
        const res = await guestAgent.post(`/api/invites/${token}/join`);
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ alreadyMember: true });
    });

    it("group owner joining their own group is idempotent", async () => {
        const { agent: ownerAgent, token } = await setupOwnerWithGroup();
        const res = await ownerAgent.post(`/api/invites/${token}/join`);
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ alreadyMember: true });
    });

    it("returns 404 for an invalid token", async () => {
        const { agent: guestAgent } = await registerAndLoginUser("Guest");
        const res = await guestAgent.post("/api/invites/nonexistent_token/join");
        expect(res.status).toBe(404);
    });

    it("new member appears in group member list after joining", async () => {
        const { agent: ownerAgent, token, groupId } = await setupOwnerWithGroup();
        const { agent: guestAgent } = await registerAndLoginUser("NewMember");

        const join = await guestAgent.post(`/api/invites/${token}/join`);
        expect(join.status).toBe(201);

        const groupDetail = await ownerAgent.get(`/api/groups/${groupId}`);
        expect(groupDetail.status).toBe(200);
        // After joining, guestAgent's user should appear in the members list
        expect(groupDetail.body.members.length).toBeGreaterThanOrEqual(2);
    });
}, 30000);

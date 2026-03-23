import { Router } from "express";
import { randomBytes } from "crypto";
import { authenticate } from "../../auth/lib/session.js";
import { CreateGroupDto } from "../validators/create-group.dto.js";
import { createGroup } from "../service/create-group.service.js";
import { addMemberByEmail, removeMember, UserNotFoundError, MemberAlreadyExistsError, MemberNotFoundError, CannotRemoveOwnerError } from "../service/manage-members.service.js";
import { getDatabase, groups, groupMembers, users } from "../../../db/index.js";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export const router: Router = Router();

// ── List groups for current user ──────────────────────────────────────────────
router.get("/", authenticate, async (req, res) => {
    const currentUserId = req.user!.id;
    const db = getDatabase().getDb();

    try {
        const rows = await db
            .select({ id: groups.id, name: groups.name, description: groups.description, createdById: groups.createdById })
            .from(groups)
            .innerJoin(groupMembers, eq(groupMembers.groupId, groups.id))
            .where(eq(groupMembers.userId, currentUserId));

        return res.json(rows);
    } catch (err) {
        console.error("GET /groups error:", err);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch groups" } });
    }
});

// ── Create group ──────────────────────────────────────────────────────────────
router.post("/", authenticate, async (req, res) => {
    const parsed = CreateGroupDto.safeParse(req.body ?? {});
    if (!parsed.success) {
        return res.status(400).json({ error: { code: "BAD_REQUEST", issues: parsed.error.flatten() } });
    }

    try {
        const group = await createGroup(parsed.data, req.user!.id);
        return res.status(201).json(group);
    } catch (err: any) {
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: err?.message || "Failed to create group" } });
    }
});

// ── Group detail with members ─────────────────────────────────────────────────
router.get("/:id", authenticate, async (req, res) => {
    const currentUserId = req.user!.id;
    const { id: groupId } = req.params;
    const db = getDatabase().getDb();

    try {
        const [membership] = await db
            .select({ role: groupMembers.role })
            .from(groupMembers)
            .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, currentUserId)))
            .limit(1);

        if (!membership) {
            return res.status(404).json({ error: { code: "NOT_FOUND", message: "Group not found" } });
        }

        const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
        if (!group) {
            return res.status(404).json({ error: { code: "NOT_FOUND", message: "Group not found" } });
        }

        const members = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                role: groupMembers.role,
                joinedAt: groupMembers.joinedAt,
            })
            .from(groupMembers)
            .innerJoin(users, eq(users.id, groupMembers.userId))
            .where(eq(groupMembers.groupId, groupId));

        return res.json({ ...group, members });
    } catch (err) {
        console.error("GET /groups/:id error:", err);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch group" } });
    }
});

// ── Delete group (owner only) ─────────────────────────────────────────────────
router.delete("/:id", authenticate, async (req, res) => {
    const currentUserId = req.user!.id;
    const { id: groupId } = req.params;
    const db = getDatabase().getDb();

    try {
        const [membership] = await db
            .select({ role: groupMembers.role })
            .from(groupMembers)
            .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, currentUserId)))
            .limit(1);

        if (!membership) {
            return res.status(404).json({ error: { code: "NOT_FOUND", message: "Group not found" } });
        }
        if (membership.role !== "owner") {
            return res.status(403).json({ error: { code: "FORBIDDEN", message: "Only the group owner can delete it" } });
        }

        await db.delete(groups).where(eq(groups.id, groupId));
        return res.status(204).send();
    } catch (err) {
        console.error("DELETE /groups/:id error:", err);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to delete group" } });
    }
});

// ── Add member by email (owner only) ─────────────────────────────────────────
router.post("/:id/members", authenticate, async (req, res) => {
    const currentUserId = req.user!.id;
    const { id: groupId } = req.params;
    const db = getDatabase().getDb();

    const parsed = z.object({ email: z.string().email() }).safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Valid email required" } });
    }

    try {
        const [membership] = await db
            .select({ role: groupMembers.role })
            .from(groupMembers)
            .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, currentUserId)))
            .limit(1);

        if (!membership) {
            return res.status(404).json({ error: { code: "NOT_FOUND", message: "Group not found" } });
        }
        if (membership.role !== "owner") {
            return res.status(403).json({ error: { code: "FORBIDDEN", message: "Only owners can add members" } });
        }

        const newMember = await addMemberByEmail(groupId, parsed.data.email);
        return res.status(201).json(newMember);
    } catch (err) {
        if (err instanceof UserNotFoundError) return res.status(404).json({ error: { code: "USER_NOT_FOUND", message: err.message } });
        if (err instanceof MemberAlreadyExistsError) return res.status(409).json({ error: { code: "ALREADY_MEMBER", message: err.message } });
        console.error("POST /groups/:id/members error:", err);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to add member" } });
    }
});

// ── Generate / retrieve invite token (owner only) ────────────────────────────
router.post("/:id/invite", authenticate, async (req, res) => {
    const currentUserId = req.user!.id;
    const { id: groupId } = req.params;
    const db = getDatabase().getDb();

    try {
        const [membership] = await db
            .select({ role: groupMembers.role })
            .from(groupMembers)
            .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, currentUserId)))
            .limit(1);

        if (!membership) {
            return res.status(404).json({ error: { code: "NOT_FOUND", message: "Group not found" } });
        }
        if (membership.role !== "owner") {
            return res.status(403).json({ error: { code: "FORBIDDEN", message: "Only owners can manage invite links" } });
        }

        const [group] = await db
            .select({ inviteToken: groups.inviteToken })
            .from(groups)
            .where(eq(groups.id, groupId))
            .limit(1);

        if (group?.inviteToken) {
            return res.json({ token: group.inviteToken });
        }

        const token = randomBytes(32).toString("hex");
        await db.update(groups).set({ inviteToken: token }).where(eq(groups.id, groupId));
        return res.json({ token });
    } catch (err) {
        console.error("POST /groups/:id/invite error:", err);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to generate invite" } });
    }
});

// ── Remove member (owner only) ────────────────────────────────────────────────
router.delete("/:id/members/:userId", authenticate, async (req, res) => {
    const currentUserId = req.user!.id;
    const { id: groupId, userId: targetUserId } = req.params;
    const db = getDatabase().getDb();

    try {
        const [membership] = await db
            .select({ role: groupMembers.role })
            .from(groupMembers)
            .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, currentUserId)))
            .limit(1);

        if (!membership) {
            return res.status(404).json({ error: { code: "NOT_FOUND", message: "Group not found" } });
        }
        if (membership.role !== "owner" && currentUserId !== targetUserId) {
            return res.status(403).json({ error: { code: "FORBIDDEN", message: "Only owners can remove other members" } });
        }

        await removeMember(groupId, targetUserId);
        return res.status(204).send();
    } catch (err) {
        if (err instanceof MemberNotFoundError) return res.status(404).json({ error: { code: "NOT_FOUND", message: err.message } });
        if (err instanceof CannotRemoveOwnerError) return res.status(400).json({ error: { code: "CANNOT_REMOVE_OWNER", message: err.message } });
        console.error("DELETE /groups/:id/members/:userId error:", err);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to remove member" } });
    }
});

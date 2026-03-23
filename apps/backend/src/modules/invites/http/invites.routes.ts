import { Router } from "express";
import { authenticate } from "../../auth/lib/session.js";
import { getDatabase, groups, groupMembers } from "../../../db/index.js";
import { eq, and } from "drizzle-orm";

export const router: Router = Router();

// ── GET /api/invites/:token — public, returns group info for the invite page ──
router.get("/:token", async (req, res) => {
    const { token } = req.params;
    const db = getDatabase().getDb();

    try {
        const [group] = await db
            .select({ id: groups.id, name: groups.name, description: groups.description })
            .from(groups)
            .where(eq(groups.inviteToken, token))
            .limit(1);

        if (!group) {
            return res.status(404).json({ error: { code: "NOT_FOUND", message: "Invalid or expired invite link" } });
        }

        return res.json(group);
    } catch (err) {
        console.error("GET /api/invites/:token error:", err);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to validate invite" } });
    }
});

// ── POST /api/invites/:token/join — authenticated, adds current user to group ─
router.post("/:token/join", authenticate, async (req, res) => {
    const { token } = req.params;
    const currentUserId = req.user!.id;
    const db = getDatabase().getDb();

    try {
        const [group] = await db
            .select({ id: groups.id, name: groups.name })
            .from(groups)
            .where(eq(groups.inviteToken, token))
            .limit(1);

        if (!group) {
            return res.status(404).json({ error: { code: "NOT_FOUND", message: "Invalid or expired invite link" } });
        }

        // Already a member — idempotent, just return groupId
        const [existing] = await db
            .select({ id: groupMembers.id })
            .from(groupMembers)
            .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, currentUserId)))
            .limit(1);

        if (existing) {
            return res.json({ groupId: group.id, alreadyMember: true });
        }

        await db.insert(groupMembers).values({
            groupId: group.id,
            userId: currentUserId,
            role: "member",
        });

        return res.status(201).json({ groupId: group.id, alreadyMember: false });
    } catch (err) {
        console.error("POST /api/invites/:token/join error:", err);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to join group" } });
    }
});

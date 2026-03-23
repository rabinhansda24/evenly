import { Router } from "express";
import { authenticate } from "../../auth/lib/session.js";
import { CreateSettlementDto } from "../validators/create-settlement.dto.js";
import { getGroupBalances, listSettlements, createSettlement } from "../service/settlements.service.js";
import { getDatabase, groupMembers } from "../../../db/index.js";
import { eq, and } from "drizzle-orm";

export const router: Router = Router();

async function verifyMember(groupId: string, userId: string) {
    const db = getDatabase().getDb();
    const [m] = await db
        .select({ role: groupMembers.role })
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
        .limit(1);
    return m ?? null;
}

router.get("/:groupId/balances", authenticate, async (req, res) => {
    const currentUserId = req.user!.id;
    const { groupId } = req.params;

    try {
        const membership = await verifyMember(groupId, currentUserId);
        if (!membership) {
            return res.status(404).json({ error: { code: "NOT_FOUND", message: "Group not found" } });
        }
        const balances = await getGroupBalances(groupId);
        return res.json(balances);
    } catch (err) {
        console.error("GET /groups/:groupId/balances error:", err);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to calculate balances" } });
    }
});

router.get("/:groupId/settlements", authenticate, async (req, res) => {
    const currentUserId = req.user!.id;
    const { groupId } = req.params;

    try {
        const membership = await verifyMember(groupId, currentUserId);
        if (!membership) {
            return res.status(404).json({ error: { code: "NOT_FOUND", message: "Group not found" } });
        }
        const list = await listSettlements(groupId);
        return res.json(list);
    } catch (err) {
        console.error("GET /groups/:groupId/settlements error:", err);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch settlements" } });
    }
});

router.post("/:groupId/settlements", authenticate, async (req, res) => {
    const currentUserId = req.user!.id;
    const { groupId } = req.params;

    const parsed = CreateSettlementDto.safeParse(req.body ?? {});
    if (!parsed.success) {
        return res.status(400).json({ error: { code: "BAD_REQUEST", issues: parsed.error.flatten() } });
    }

    try {
        const membership = await verifyMember(groupId, currentUserId);
        if (!membership) {
            return res.status(404).json({ error: { code: "NOT_FOUND", message: "Group not found" } });
        }
        const settlement = await createSettlement(groupId, currentUserId, parsed.data);
        return res.status(201).json(settlement);
    } catch (err) {
        console.error("POST /groups/:groupId/settlements error:", err);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to record settlement" } });
    }
});

import { Router } from "express";
import { authenticate } from "../../auth/lib/session.js";
import { CreateGroupDto } from "../validators/create-group.dto.js";
import { createGroup } from "../service/create-group.service.js";
import { getDatabase, groups, groupMembers } from "../../../db/index.js";
import { eq } from "drizzle-orm";

export const router: Router = Router();

router.get("/", authenticate, async (req, res) => {
    const currentUserId = (req as any).user?.id as string;
    const db = getDatabase().getDb();

    const rows = await db
        .select({ id: groups.id, name: groups.name, description: groups.description, createdById: groups.createdById })
        .from(groups)
        .innerJoin(groupMembers, eq(groupMembers.groupId as any, groups.id as any))
        .where(eq(groupMembers.userId as any, currentUserId));

    return res.json(rows);
});

router.post("/", authenticate, async (req, res) => {
    const parsed = CreateGroupDto.safeParse(req.body ?? {});
    if (!parsed.success) {
        return res.status(400).json({ error: { code: "BAD_REQUEST", issues: parsed.error.flatten() } });
    }

    try {
        const currentUserId = (req as any).user?.id as string;
        const group = await createGroup(parsed.data, currentUserId);
        return res.status(201).json(group);
    } catch (err: any) {
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: err?.message || "Failed to create group" } });
    }
});

import { Router } from "express";
import { authenticate } from "../../auth/lib/session.js";
import { CreateGroupDto } from "../validators/create-group.dto.js";
import { createGroup } from "../service/create-group.service.js";

export const router = Router();

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

import { Router } from "express";
import { authenticate } from "../../auth/lib/session.js";
import { CreateExpenseDto } from "../validators/create-expense.dto.js";
import { createExpense, listExpenses, deleteExpense, ExpenseNotFoundError } from "../service/expenses.service.js";
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

router.get("/:groupId/expenses", authenticate, async (req, res) => {
    const currentUserId = req.user!.id;
    const { groupId } = req.params;

    try {
        const membership = await verifyMember(groupId, currentUserId);
        if (!membership) {
            return res.status(404).json({ error: { code: "NOT_FOUND", message: "Group not found" } });
        }
        const list = await listExpenses(groupId);
        return res.json(list);
    } catch (err) {
        console.error("GET /groups/:groupId/expenses error:", err);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch expenses" } });
    }
});

router.post("/:groupId/expenses", authenticate, async (req, res) => {
    const currentUserId = req.user!.id;
    const { groupId } = req.params;

    const parsed = CreateExpenseDto.safeParse(req.body ?? {});
    if (!parsed.success) {
        return res.status(400).json({ error: { code: "BAD_REQUEST", issues: parsed.error.flatten() } });
    }

    try {
        const membership = await verifyMember(groupId, currentUserId);
        if (!membership) {
            return res.status(404).json({ error: { code: "NOT_FOUND", message: "Group not found" } });
        }
        const expense = await createExpense(groupId, parsed.data);
        return res.status(201).json(expense);
    } catch (err) {
        console.error("POST /groups/:groupId/expenses error:", err);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to create expense" } });
    }
});

router.delete("/:groupId/expenses/:expenseId", authenticate, async (req, res) => {
    const currentUserId = req.user!.id;
    const { groupId, expenseId } = req.params;

    try {
        await deleteExpense(expenseId, groupId, currentUserId);
        return res.status(204).send();
    } catch (err) {
        if (err instanceof ExpenseNotFoundError) {
            return res.status(404).json({ error: { code: "NOT_FOUND", message: err.message } });
        }
        console.error("DELETE /groups/:groupId/expenses/:expenseId error:", err);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to delete expense" } });
    }
});

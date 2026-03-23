import { getDatabase, expenses, expenseParticipants, users, groupMembers } from "../../../db/index.js";
import { eq, and, inArray } from "drizzle-orm";
import type { CreateExpenseInput } from "../validators/create-expense.dto.js";

export class ExpenseNotFoundError extends Error {
    constructor() { super("Expense not found"); this.name = "ExpenseNotFoundError"; }
}

function calcShares(amount: number, splitMode: string, participants: CreateExpenseInput["participants"]) {
    if (splitMode === "equal") {
        const share = amount / participants.length;
        return participants.map(p => ({ userId: p.userId, share, weight: null }));
    }
    if (splitMode === "fixed") {
        return participants.map(p => ({ userId: p.userId, share: p.share ?? 0, weight: null }));
    }
    // weights
    const totalWeight = participants.reduce((s, p) => s + (p.weight ?? 1), 0);
    return participants.map(p => ({
        userId: p.userId,
        share: amount * ((p.weight ?? 1) / totalWeight),
        weight: p.weight ?? 1,
    }));
}

export async function createExpense(groupId: string, input: CreateExpenseInput) {
    const db = getDatabase().getDb();
    const shares = calcShares(input.amount, input.splitMode, input.participants);

    return db.transaction(async (tx) => {
        const [expense] = await tx
            .insert(expenses)
            .values({
                groupId,
                paidById: input.paidById,
                amount: input.amount.toFixed(2),
                description: input.description,
                category: input.category,
                splitMode: input.splitMode,
            })
            .returning();

        await tx.insert(expenseParticipants).values(
            shares.map(s => ({
                expenseId: expense.id,
                userId: s.userId,
                share: s.share.toFixed(2),
                weight: s.weight !== null ? s.weight.toFixed(4) : null,
            }))
        );

        return expense;
    });
}

export async function listExpenses(groupId: string) {
    const db = getDatabase().getDb();

    const rows = await db
        .select({
            id: expenses.id,
            description: expenses.description,
            amount: expenses.amount,
            category: expenses.category,
            splitMode: expenses.splitMode,
            createdAt: expenses.createdAt,
            paidById: expenses.paidById,
            paidByName: users.name,
        })
        .from(expenses)
        .innerJoin(users, eq(users.id, expenses.paidById))
        .where(eq(expenses.groupId, groupId))
        .orderBy(expenses.createdAt);

    if (rows.length === 0) return [];

    const expenseIds = rows.map(r => r.id);
    const participants = await db
        .select({
            expenseId: expenseParticipants.expenseId,
            userId: expenseParticipants.userId,
            share: expenseParticipants.share,
            name: users.name,
        })
        .from(expenseParticipants)
        .innerJoin(users, eq(users.id, expenseParticipants.userId))
        .where(inArray(expenseParticipants.expenseId, expenseIds));

    const participantsByExpense = participants.reduce<Record<string, typeof participants>>((acc, p) => {
        (acc[p.expenseId] ??= []).push(p);
        return acc;
    }, {});

    return rows.map(r => ({ ...r, participants: participantsByExpense[r.id] ?? [] }));
}

export async function deleteExpense(expenseId: string, groupId: string, currentUserId: string) {
    const db = getDatabase().getDb();

    const [expense] = await db
        .select({ id: expenses.id, paidById: expenses.paidById })
        .from(expenses)
        .where(and(eq(expenses.id, expenseId), eq(expenses.groupId, groupId)))
        .limit(1);

    if (!expense) throw new ExpenseNotFoundError();

    // Only payer or group owner can delete
    const [membership] = await db
        .select({ role: groupMembers.role })
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, currentUserId)))
        .limit(1);

    if (expense.paidById !== currentUserId && membership?.role !== "owner") {
        throw new ExpenseNotFoundError(); // hide existence from non-authorized users
    }

    await db.delete(expenses).where(eq(expenses.id, expenseId));
}

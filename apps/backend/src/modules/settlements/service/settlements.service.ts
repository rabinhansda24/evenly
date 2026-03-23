import { getDatabase, expenses, expenseParticipants, settlements, users, groupMembers } from "../../../db/index.js";
import { eq, and, inArray } from "drizzle-orm";
import type { CreateSettlementInput } from "../validators/create-settlement.dto.js";

export async function getGroupBalances(groupId: string) {
    const db = getDatabase().getDb();

    const members = await db
        .select({ userId: users.id, name: users.name })
        .from(groupMembers)
        .innerJoin(users, eq(users.id, groupMembers.userId))
        .where(eq(groupMembers.groupId, groupId));

    const expensesList = await db
        .select({ id: expenses.id, paidById: expenses.paidById, amount: expenses.amount })
        .from(expenses)
        .where(eq(expenses.groupId, groupId));

    const participants = expensesList.length > 0
        ? await db
            .select({ userId: expenseParticipants.userId, share: expenseParticipants.share })
            .from(expenseParticipants)
            .where(inArray(expenseParticipants.expenseId, expensesList.map(e => e.id)))
        : [];

    const settlementsList = await db
        .select({
            fromUserId: settlements.fromUserId,
            toUserId: settlements.toUserId,
            amount: settlements.amount,
        })
        .from(settlements)
        .where(eq(settlements.groupId, groupId));

    const balance: Record<string, number> = {};
    for (const m of members) balance[m.userId] = 0;

    for (const e of expensesList) {
        balance[e.paidById] = (balance[e.paidById] ?? 0) + Number(e.amount);
    }
    for (const p of participants) {
        balance[p.userId] = (balance[p.userId] ?? 0) - Number(p.share);
    }
    for (const s of settlementsList) {
        balance[s.fromUserId] = (balance[s.fromUserId] ?? 0) + Number(s.amount);
        balance[s.toUserId] = (balance[s.toUserId] ?? 0) - Number(s.amount);
    }

    return members.map(m => ({
        userId: m.userId,
        name: m.name,
        balance: Math.round(balance[m.userId] * 100) / 100,
    }));
}

export async function listSettlements(groupId: string) {
    const db = getDatabase().getDb();
    const fromUser = users;
    const toUser = { ...users };

    const rows = await db
        .select({
            id: settlements.id,
            amount: settlements.amount,
            description: settlements.description,
            createdAt: settlements.createdAt,
            fromUserId: settlements.fromUserId,
            toUserId: settlements.toUserId,
        })
        .from(settlements)
        .where(eq(settlements.groupId, groupId))
        .orderBy(settlements.createdAt);

    return rows;
}

export async function createSettlement(groupId: string, fromUserId: string, input: CreateSettlementInput) {
    const db = getDatabase().getDb();

    const [settlement] = await db
        .insert(settlements)
        .values({
            groupId,
            fromUserId,
            toUserId: input.toUserId,
            amount: input.amount.toFixed(2),
            description: input.description ?? null,
        })
        .returning();

    return settlement;
}

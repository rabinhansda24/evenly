import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Inline DB mock ────────────────────────────────────────────────────────────
const { moduleExports, state } = vi.hoisted(() => {
    const state = {
        members: [] as { userId: string; name: string }[],
        expensesList: [] as { id: string; paidById: string; amount: string }[],
        participants: [] as { userId: string; share: string }[],
        settlementsList: [] as { fromUserId: string; toUserId: string; amount: string }[],
        inserted: null as any,
    };

    // Table tokens — used as identity keys in the fake db
    const groupMembers = {} as any;
    const users = {} as any;
    const expenses = {} as any;
    const expenseParticipants = {} as any;
    const settlements = {} as any;

    function dataFor(table: any): any[] {
        if (table === groupMembers) return state.members;
        if (table === expenses) return state.expensesList;
        if (table === expenseParticipants) return state.participants;
        if (table === settlements) return state.settlementsList;
        return [];
    }

    // Returns a thenable that also supports .orderBy() / .limit() chaining
    function chainable(table: any) {
        const p = Promise.resolve(dataFor(table));
        return {
            orderBy: (_: any) => p,
            limit: (_: any) => p,
            then: (res: any, rej: any) => p.then(res, rej),
            catch: (rej: any) => p.catch(rej),
        };
    }

    const fakeDb = {
        select: (_shape?: any) => ({
            from: (table: any) => ({
                // used by getGroupBalances: members join
                innerJoin: (_t: any, _c: any) => ({
                    where: (_c: any) => chainable(table),
                }),
                // used by getGroupBalances: expenses, participants, settlements
                // used by listSettlements: .where().orderBy()
                where: (_c: any) => chainable(table),
            }),
        }),
        insert: (_table: any) => ({
            values: (vals: any) => ({
                returning: async () => {
                    const id = "s_" + Math.random().toString(36).slice(2, 8);
                    state.inserted = { id, ...vals };
                    return [state.inserted];
                },
            }),
        }),
    };

    const moduleExports = {
        getDatabase: () => ({ getDb: () => fakeDb }),
        groupMembers,
        users,
        expenses,
        expenseParticipants,
        settlements,
    };

    return { moduleExports, state };
});

vi.mock("../../../../db/index.js", () => moduleExports);

import { getGroupBalances, listSettlements, createSettlement } from "../../service/settlements.service.js";

// ── getGroupBalances ──────────────────────────────────────────────────────────
describe("settlements: getGroupBalances", () => {
    beforeEach(() => {
        state.members = [];
        state.expensesList = [];
        state.participants = [];
        state.settlementsList = [];
        state.inserted = null;
    });

    it("returns zero balances when there are no expenses or settlements", async () => {
        state.members = [
            { userId: "u1", name: "Alice" },
            { userId: "u2", name: "Bob" },
        ];

        const result = await getGroupBalances("g1");

        expect(result).toHaveLength(2);
        expect(result.find(r => r.userId === "u1")).toMatchObject({ balance: 0 });
        expect(result.find(r => r.userId === "u2")).toMatchObject({ balance: 0 });
    });

    it("credits the payer and debits participants by their share", async () => {
        // Alice pays $30; Alice and Bob each owe $15
        state.members = [
            { userId: "u1", name: "Alice" },
            { userId: "u2", name: "Bob" },
        ];
        state.expensesList = [{ id: "e1", paidById: "u1", amount: "30.00" }];
        state.participants = [
            { userId: "u1", share: "15.00" },
            { userId: "u2", share: "15.00" },
        ];

        const result = await getGroupBalances("g1");
        const alice = result.find(r => r.userId === "u1")!;
        const bob = result.find(r => r.userId === "u2")!;

        expect(alice.balance).toBe(15);   // paid 30, owes 15 → +15
        expect(bob.balance).toBe(-15);    // paid 0, owes 15 → -15
    });

    it("reduces balances when a settlement is recorded", async () => {
        // Same setup as above, but Bob settles $15 to Alice
        state.members = [
            { userId: "u1", name: "Alice" },
            { userId: "u2", name: "Bob" },
        ];
        state.expensesList = [{ id: "e1", paidById: "u1", amount: "30.00" }];
        state.participants = [
            { userId: "u1", share: "15.00" },
            { userId: "u2", share: "15.00" },
        ];
        state.settlementsList = [
            { fromUserId: "u2", toUserId: "u1", amount: "15.00" },
        ];

        const result = await getGroupBalances("g1");
        const alice = result.find(r => r.userId === "u1")!;
        const bob = result.find(r => r.userId === "u2")!;

        expect(alice.balance).toBe(0);
        expect(bob.balance).toBe(0);
    });

    it("handles multiple expenses across 3 members correctly", async () => {
        // Expense 1: Alice pays $90, all three share equally ($30 each)
        // Expense 2: Bob pays $60, Alice and Bob share equally ($30 each)
        state.members = [
            { userId: "u1", name: "Alice" },
            { userId: "u2", name: "Bob" },
            { userId: "u3", name: "Charlie" },
        ];
        state.expensesList = [
            { id: "e1", paidById: "u1", amount: "90.00" },
            { id: "e2", paidById: "u2", amount: "60.00" },
        ];
        state.participants = [
            { userId: "u1", share: "30.00" }, // e1 share
            { userId: "u2", share: "30.00" },
            { userId: "u3", share: "30.00" },
            { userId: "u1", share: "30.00" }, // e2 share
            { userId: "u2", share: "30.00" },
        ];

        const result = await getGroupBalances("g1");
        const alice = result.find(r => r.userId === "u1")!;
        const bob = result.find(r => r.userId === "u2")!;
        const charlie = result.find(r => r.userId === "u3")!;

        // Alice: paid 90, owes 30+30=60 → +30
        expect(alice.balance).toBe(30);
        // Bob: paid 60, owes 30+30=60 → 0
        expect(bob.balance).toBe(0);
        // Charlie: paid 0, owes 30 → -30
        expect(charlie.balance).toBe(-30);
    });

    it("rounds balance to 2 decimal places", async () => {
        // $10 split 3 ways with pre-rounded shares
        state.members = [
            { userId: "u1", name: "Alice" },
            { userId: "u2", name: "Bob" },
            { userId: "u3", name: "Charlie" },
        ];
        state.expensesList = [{ id: "e1", paidById: "u1", amount: "10.00" }];
        state.participants = [
            { userId: "u1", share: "3.33" },
            { userId: "u2", share: "3.33" },
            { userId: "u3", share: "3.34" },
        ];

        const result = await getGroupBalances("g1");
        const alice = result.find(r => r.userId === "u1")!;

        // 10 - 3.33 = 6.67
        expect(alice.balance).toBe(6.67);
    });

    it("returns empty array when group has no members", async () => {
        state.members = [];
        const result = await getGroupBalances("g1");
        expect(result).toHaveLength(0);
    });

    it("partial settlement: balance reduced but not zeroed", async () => {
        // Alice pays $100, Bob owes $50; Bob partially settles $20
        state.members = [
            { userId: "u1", name: "Alice" },
            { userId: "u2", name: "Bob" },
        ];
        state.expensesList = [{ id: "e1", paidById: "u1", amount: "100.00" }];
        state.participants = [
            { userId: "u1", share: "50.00" },
            { userId: "u2", share: "50.00" },
        ];
        state.settlementsList = [{ fromUserId: "u2", toUserId: "u1", amount: "20.00" }];

        const result = await getGroupBalances("g1");
        const alice = result.find(r => r.userId === "u1")!;
        const bob = result.find(r => r.userId === "u2")!;

        expect(alice.balance).toBe(30);  // 50 - 20
        expect(bob.balance).toBe(-30);   // -50 + 20
    });
});

// ── createSettlement ──────────────────────────────────────────────────────────
describe("settlements: createSettlement", () => {
    beforeEach(() => {
        state.inserted = null;
    });

    it("inserts a settlement and returns it with correct fields", async () => {
        const result = await createSettlement("g1", "u1", {
            toUserId: "u2",
            amount: 15,
            description: "Bob pays Alice",
        });

        expect(result).toHaveProperty("id");
        expect(result).toMatchObject({
            groupId: "g1",
            fromUserId: "u1",
            toUserId: "u2",
            amount: "15.00",
            description: "Bob pays Alice",
        });
    });

    it("stores amount formatted to 2 decimal places", async () => {
        const result = await createSettlement("g1", "u1", {
            toUserId: "u2",
            amount: 7.5,
        });

        expect(result.amount).toBe("7.50");
    });

    it("stores null description when not provided", async () => {
        const result = await createSettlement("g1", "u1", {
            toUserId: "u2",
            amount: 20,
        });

        expect(result.description).toBeNull();
    });
});

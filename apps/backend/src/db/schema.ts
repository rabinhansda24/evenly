import { pgTable, uuid, varchar, timestamp, numeric, uniqueIndex, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 120 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Groups table
export const groups = pgTable("groups", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    createdById: uuid("created_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Group members table (many-to-many relationship)
export const groupMembers = pgTable("group_members", {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull().default("member"), // "owner" | "member"
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    uniqueGroupUser: uniqueIndex("uq_group_user").on(table.groupId, table.userId),
}));

// Expenses table
export const expenses = pgTable("expenses", {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
    paidById: uuid("paid_by_id").notNull().references(() => users.id),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    description: varchar("description", { length: 300 }).notNull(),
    category: varchar("category", { length: 50 }).default("general"),
    splitMode: varchar("split_mode", { length: 16 }).notNull().default("equal"), // 'equal' | 'weights' | 'fixed'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Expense participants table
export const expenseParticipants = pgTable("expense_participants", {
    id: uuid("id").primaryKey().defaultRandom(),
    expenseId: uuid("expense_id").notNull().references(() => expenses.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id),
    share: numeric("share", { precision: 12, scale: 2 }).notNull(),
    weight: numeric("weight", { precision: 8, scale: 4 }), // For future weighted splits
}, (table) => ({
    uniqueExpenseUser: uniqueIndex("uq_expense_user").on(table.expenseId, table.userId),
}));

// Settlements table
export const settlements = pgTable("settlements", {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
    fromUserId: uuid("from_user_id").notNull().references(() => users.id),
    toUserId: uuid("to_user_id").notNull().references(() => users.id),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    description: varchar("description", { length: 300 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    groupMemberships: many(groupMembers),
    createdGroups: many(groups),
    paidExpenses: many(expenses),
    expenseParticipations: many(expenseParticipants),
    sentSettlements: many(settlements, { relationName: "sentSettlements" }),
    receivedSettlements: many(settlements, { relationName: "receivedSettlements" }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
    creator: one(users, {
        fields: [groups.createdById],
        references: [users.id],
    }),
    members: many(groupMembers),
    expenses: many(expenses),
    settlements: many(settlements),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
    group: one(groups, {
        fields: [groupMembers.groupId],
        references: [groups.id],
    }),
    user: one(users, {
        fields: [groupMembers.userId],
        references: [users.id],
    }),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
    group: one(groups, {
        fields: [expenses.groupId],
        references: [groups.id],
    }),
    paidBy: one(users, {
        fields: [expenses.paidById],
        references: [users.id],
    }),
    participants: many(expenseParticipants),
}));

export const expenseParticipantsRelations = relations(expenseParticipants, ({ one }) => ({
    expense: one(expenses, {
        fields: [expenseParticipants.expenseId],
        references: [expenses.id],
    }),
    user: one(users, {
        fields: [expenseParticipants.userId],
        references: [users.id],
    }),
}));

export const settlementsRelations = relations(settlements, ({ one }) => ({
    group: one(groups, {
        fields: [settlements.groupId],
        references: [groups.id],
    }),
    fromUser: one(users, {
        fields: [settlements.fromUserId],
        references: [users.id],
        relationName: "sentSettlements",
    }),
    toUser: one(users, {
        fields: [settlements.toUserId],
        references: [users.id],
        relationName: "receivedSettlements",
    }),
}));

// Type exports for use in application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;

export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export type ExpenseParticipant = typeof expenseParticipants.$inferSelect;
export type NewExpenseParticipant = typeof expenseParticipants.$inferInsert;

export type Settlement = typeof settlements.$inferSelect;
export type NewSettlement = typeof settlements.$inferInsert;
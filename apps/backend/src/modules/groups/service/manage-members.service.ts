import { getDatabase, users, groupMembers } from "../../../db/index.js";
import { eq, and } from "drizzle-orm";

export class UserNotFoundError extends Error {
    constructor() { super("No user found with that email"); this.name = "UserNotFoundError"; }
}
export class MemberAlreadyExistsError extends Error {
    constructor() { super("User is already a member of this group"); this.name = "MemberAlreadyExistsError"; }
}
export class MemberNotFoundError extends Error {
    constructor() { super("User is not a member of this group"); this.name = "MemberNotFoundError"; }
}
export class CannotRemoveOwnerError extends Error {
    constructor() { super("Cannot remove the group owner"); this.name = "CannotRemoveOwnerError"; }
}

export async function addMemberByEmail(groupId: string, email: string) {
    const db = getDatabase().getDb();

    const [targetUser] = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

    if (!targetUser) throw new UserNotFoundError();

    const existing = await db
        .select({ id: groupMembers.id })
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUser.id)))
        .limit(1);

    if (existing.length) throw new MemberAlreadyExistsError();

    await db.insert(groupMembers).values({ groupId, userId: targetUser.id, role: "member" });

    return targetUser;
}

export async function removeMember(groupId: string, targetUserId: string) {
    const db = getDatabase().getDb();

    const [membership] = await db
        .select({ role: groupMembers.role })
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)))
        .limit(1);

    if (!membership) throw new MemberNotFoundError();
    if (membership.role === "owner") throw new CannotRemoveOwnerError();

    await db
        .delete(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)));
}

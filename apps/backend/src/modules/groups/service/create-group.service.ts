import { getDatabase, groups, groupMembers } from "../../../db/index.js";

export type CreateGroupInput = {
    name: string;
    description?: string | null;
};

export async function createGroup(input: CreateGroupInput, currentUserId: string) {
    const name = (input.name ?? "").trim();
    if (!name) {
        throw new Error("Group name is required");
    }

    const db = getDatabase().getDb();

    // Create group
    const [created] = await db
        .insert(groups)
        .values({
            name,
            description: input.description ?? null,
            createdById: currentUserId,
        })
        .returning({ id: groups.id, name: groups.name, description: groups.description, createdById: groups.createdById });

    // Add owner membership for creator
    await db
        .insert(groupMembers)
        .values({ groupId: created.id, userId: currentUserId, role: "owner" })
        .returning();

    return created;
}

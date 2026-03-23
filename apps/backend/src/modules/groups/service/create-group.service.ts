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

    return db.transaction(async (tx) => {
        // Create group
        const [created] = await tx
            .insert(groups)
            .values({
                name,
                description: input.description ?? null,
                createdById: currentUserId,
            })
            .returning({ id: groups.id, name: groups.name, description: groups.description, createdById: groups.createdById });

        // Add owner membership for creator (atomic with group creation)
        await tx
            .insert(groupMembers)
            .values({ groupId: created.id, userId: currentUserId, role: "owner" });

        return created;
    });
}

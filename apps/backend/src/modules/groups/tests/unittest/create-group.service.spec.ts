import { describe, it, expect, vi } from "vitest";

// Inline DB mock tailored for groups feature
const { moduleExports, state } = vi.hoisted(() => {
    const state = {
        groupsInserted: [] as any[],
        groupMembersInserted: [] as any[],
    };

    const groups = {} as any;
    const groupMembers = {} as any;

    const fakeDb = {
        insert: (table: any) => ({
            values: (vals: any) => ({
                returning: async (shape?: any) => {
                    if (table === groups) {
                        const id = "g_" + Math.random().toString(36).slice(2, 10);
                        const row = { id, ...vals };
                        state.groupsInserted.push(row);
                        // If a shape is requested, map the row fields accordingly; otherwise return full row
                        if (shape && typeof shape === "object") {
                            const out: any = {};
                            for (const k of Object.keys(shape)) {
                                // map by key if present on row
                                out[k] = (row as any)[k];
                            }
                            return [out];
                        }
                        return [row];
                    }
                    if (table === groupMembers) {
                        const id = "gm_" + Math.random().toString(36).slice(2, 10);
                        const row = { id, ...vals };
                        state.groupMembersInserted.push(row);
                        return [row];
                    }
                    throw new Error("Unknown table in fakeDb.insert");
                },
            }),
        }),
    };

    const moduleExports = {
        getDatabase: () => ({ getDb: () => fakeDb }),
        groups,
        groupMembers,
        __state: state,
    };

    return { moduleExports, state };
});

vi.mock("../../../../db/index.js", () => moduleExports);

// Import after mocks so the service picks up the mocked DB
import { createGroup } from "../../service/create-group.service";
// @ts-expect-error pull mock state for assertions
import { __state as dbState } from "../../../../db/index.js";

describe("groups: createGroup (service)", () => {
    it("creates a group with owner membership and returns public fields", async () => {
        const input = { name: "Trip to Goa", description: "Friends trip" };
        const currentUserId = "u_owner";

        const group = await createGroup(input, currentUserId);

        expect(group).toHaveProperty("id");
        expect(group).toMatchObject({
            name: input.name,
            description: input.description,
            createdById: currentUserId,
        });

        // Verify DB side-effects via mock state
        expect(dbState.groupsInserted.length).toBe(1);
        expect(dbState.groupMembersInserted.length).toBe(1);
        expect(dbState.groupMembersInserted[0]).toMatchObject({
            groupId: group.id,
            userId: currentUserId,
            role: "owner",
        });
    });

    it("rejects empty or whitespace-only name", async () => {
        const badInputs = ["", " ", "\t", "\n"];

        for (const name of badInputs) {
            await expect(createGroup({ name } as any, "u1")).rejects.toThrow();
        }
    });
});

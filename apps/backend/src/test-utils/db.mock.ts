// Reusable DB module mock for unit tests
// Provides a fake drizzle-like API surface used by services and an adjustable state

export type DbMockState = {
    findExisting: boolean;
    lastInserted: any;
    selectedUser?: any | null;
};

export function buildDbMock(): { moduleExports: any; state: DbMockState } {
    const state: DbMockState = { findExisting: false, lastInserted: null, selectedUser: null };

    const fakeDb = {
        select: () => ({
            from: () => ({
                where: () => ({
                    limit: async () => {
                        if (!state.findExisting) return [];
                        if (state.selectedUser) return [state.selectedUser];
                        return [{ id: "existing-id" }];
                    },
                }),
            }),
        }),
        insert: () => ({
            values: (vals: any) => ({
                returning: async () => {
                    const id = "u_" + Math.random().toString(36).slice(2, 10);
                    state.lastInserted = { id, ...vals };
                    return [{ id, email: vals.email, name: vals.name }];
                },
            }),
        }),
    };

    const moduleExports = {
        getDatabase: () => ({ getDb: () => fakeDb }),
        users: {}, // token to satisfy service import usage
        __state: state,
    };

    return { moduleExports, state };
}

// Reusable DB module mock for unit tests (CommonJS for hoisted require)
// Provides a fake drizzle-like API surface used by services and an adjustable state

function buildDbMock() {
    const state = { findExisting: false, lastInserted: null, selectedUser: null };

    const fakeDb = {
        select: () => ({
            from: () => ({
                where: () => ({
                    limit: async () => {
                        if (!state.findExisting) return [];
                        // Return a realistic user row if provided
                        if (state.selectedUser) return [state.selectedUser];
                        return [{ id: "existing-id" }];
                    },
                }),
            }),
        }),
        insert: () => ({
            values: (vals) => ({
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

module.exports = { buildDbMock };

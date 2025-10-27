import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import groupsReducer, { GroupsState } from '../../../../store/slices/groupsSlice'
import { fetchGroups } from '../../../../store/thunks/groupsThunks'
// Red: createGroup thunk does not exist yet; this test will fail until implemented
import { createGroup } from '../../../../store/thunks/groupsThunks'

describe('createGroup thunk (integration)', () => {
    const makeStore = (preloaded?: GroupsState) =>
        configureStore({
            reducer: { groups: groupsReducer },
            preloadedState: preloaded ? { groups: preloaded } : undefined,
        })

    const existing = { id: 'g0', name: 'Existing', description: 'Old', createdById: 'u1' }
    const newGroup = { id: 'g1', name: 'New Group', description: 'Desc', createdById: 'u1' }

    const originalFetch = globalThis.fetch
    beforeEach(() => {
        vi.restoreAllMocks()
            ; (globalThis as unknown as { fetch: typeof fetch }).fetch = vi.fn().mockImplementation((url: RequestInfo, init?: RequestInit) => {
                // Simulate POST /api/groups returning the created group
                if (typeof url === 'string' && url.endsWith('/api/groups') && init?.method === 'POST') {
                    return Promise.resolve({
                        ok: true,
                        json: async () => newGroup,
                    } as Response)
                }
                // Default: GET /api/groups returns list including new group (if thunk refetches)
                return Promise.resolve({
                    ok: true,
                    json: async () => [existing, newGroup],
                } as Response)
            })
    })

    afterEach(() => {
        vi.resetAllMocks()
            ; (globalThis as unknown as { fetch: typeof fetch }).fetch = originalFetch as any
    })

    it('POSTs to API and appends created group to state', async () => {
        const store = makeStore({ items: [existing], status: 'idle', error: null })
        await store.dispatch<any>(createGroup({ name: newGroup.name, description: newGroup.description }))
        const state = store.getState() as { groups: GroupsState }
        expect(state.groups.items.map(g => g.name)).toEqual(['Existing', 'New Group'])
    })
})

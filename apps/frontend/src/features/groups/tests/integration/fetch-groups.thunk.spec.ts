import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import groupsReducer, { GroupsState } from '../../../../store/slices/groupsSlice'
// Red: This import does not exist yet; we'll implement the thunk next
import { fetchGroups } from '../../../../store/thunks/groupsThunks'

describe('fetchGroups thunk (integration)', () => {
    const makeStore = () =>
        configureStore({
            reducer: {
                groups: groupsReducer,
            },
        })

    const mockGroups = [
        { id: 'g1', name: 'Trip', description: 'Goa', createdById: 'u1' },
        { id: 'g2', name: 'Home', description: 'Rent', createdById: 'u1' },
    ]

    const originalFetch = globalThis.fetch
    beforeEach(() => {
        vi.restoreAllMocks()
            ; (globalThis as any).fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockGroups,
            } as Response)
    })

    afterEach(() => {
        vi.resetAllMocks()
            ; (globalThis as any).fetch = originalFetch as any
    })

    it('loads groups from API and stores them', async () => {
        // Arrange: mock fetch
        const store = makeStore()

        // Act
        await store.dispatch<any>(fetchGroups())

        // Assert: API called with credentials and correct path
        expect((globalThis.fetch as any)).toHaveBeenCalled()
        const state = store.getState() as { groups: GroupsState }
        expect(state.groups.items.map(g => g.name)).toEqual(['Trip', 'Home'])
    })
})

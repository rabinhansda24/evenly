/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'

// Intentionally import from the planned implementation path (does not exist yet)
import groupsReducer, { GroupsState, setGroups } from '../../../../store/slices/groupsSlice'

describe('groupsSlice (Redux)', () => {
    it('has expected initial state', () => {
        const initial = undefined as unknown as GroupsState
        const next = groupsReducer(initial, { type: '@@INIT' })
        expect(next).toEqual({ items: [], status: 'idle', error: null })
    })

    it('setGroups replaces items', () => {
        const prev: GroupsState = { items: [], status: 'idle', error: null }
        const list = [
            { id: 'g1', name: 'Trip', description: 'Goa', createdById: 'u1' },
            { id: 'g2', name: 'Home', description: 'Rent', createdById: 'u1' },
        ]
        const next = groupsReducer(prev, setGroups(list as any))
        expect(next.items.map((g: any) => g.name)).toEqual(['Trip', 'Home'])
    })
})

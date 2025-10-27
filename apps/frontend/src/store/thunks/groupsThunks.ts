import { setGroups } from '../slices/groupsSlice'
import { apiUrl } from '../../lib/api'

export function fetchGroups() {
    return async (dispatch: (action: any) => void) => {
        const res = await fetch(apiUrl('/api/groups'), {
            credentials: 'include',
        })
        if (!res.ok) {
            throw new Error(`Failed to fetch groups: ${res.status}`)
        }
        const data = await res.json()
        dispatch(setGroups(data))
    }
}

export function createGroup(input: { name: string; description?: string | null }) {
    return async (
        dispatch: (action: any) => void,
        getState: () => { groups: { items: any[] } }
    ) => {
        const res = await fetch(apiUrl('/api/groups'), {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        })
        if (!res.ok) {
            throw new Error(`Failed to create group: ${res.status}`)
        }
        const created = await res.json()
        const state = getState()
        const next = [...(state.groups?.items ?? []), created]
        dispatch(setGroups(next))
    }
}

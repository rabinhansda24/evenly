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

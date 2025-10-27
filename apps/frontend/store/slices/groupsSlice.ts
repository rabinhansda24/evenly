import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface GroupItem {
    id: string
    name: string
    description?: string | null
    createdById: string
}

export interface GroupsState {
    items: GroupItem[]
    status: 'idle' | 'loading' | 'error'
    error: string | null
}

const initialState: GroupsState = {
    items: [],
    status: 'idle',
    error: null,
}

const groupsSlice = createSlice({
    name: 'groups',
    initialState,
    reducers: {
        setGroups(state, action: PayloadAction<GroupItem[]>) {
            state.items = action.payload
        },
    },
})

export const { setGroups } = groupsSlice.actions
export default groupsSlice.reducer

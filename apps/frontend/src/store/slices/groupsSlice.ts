import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type GroupItem = {
    id: string
    name: string
    description?: string | null
    createdById: string
}

export type GroupsState = {
    items: GroupItem[]
    status: 'idle' | 'loading' | 'succeeded' | 'failed'
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

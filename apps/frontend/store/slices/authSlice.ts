import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type User = { id: string; email: string; name: string } | null

interface AuthState {
    user: User
}

const initialState: AuthState = {
    user: null,
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<User>) {
            state.user = action.payload
        },
        logout(state) {
            state.user = null
        },
    },
})

export const { setUser, logout } = authSlice.actions
export default authSlice.reducer

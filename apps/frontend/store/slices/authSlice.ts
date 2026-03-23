import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type AuthUser = { id: string; email: string; name: string }

interface AuthState {
    user: AuthUser | null
    status: 'idle' | 'loading' | 'ready'
}

const initialState: AuthState = {
    user: null,
    status: 'idle',
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<AuthUser | null>) {
            state.user = action.payload
            state.status = 'ready'
        },
        logout(state) {
            state.user = null
            state.status = 'ready'
        },
    },
})

export const { setUser, logout } = authSlice.actions
export default authSlice.reducer

import { createAsyncThunk } from '@reduxjs/toolkit'
import { apiUrl } from '../../src/lib/api'
import { setUser, logout } from '../slices/authSlice'

export const fetchCurrentUser = createAsyncThunk(
    'auth/fetchCurrentUser',
    async (_, { dispatch }) => {
        try {
            const res = await fetch(apiUrl('/api/auth/me'), { credentials: 'include' })
            if (res.ok) {
                const user = await res.json()
                dispatch(setUser(user))
                return user
            }
        } catch {
            // network error — leave state as-is
        }
        dispatch(setUser(null))
        return null
    }
)

export const logoutUser = createAsyncThunk(
    'auth/logoutUser',
    async (_, { dispatch }) => {
        await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' })
        dispatch(logout())
    }
)

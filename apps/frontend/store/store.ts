import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import appReducer from './slices/appSlice'
import groupsReducer from './slices/groupsSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        app: appReducer,
        groups: groupsReducer,
    },
    devTools: process.env.NODE_ENV !== 'production',
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/store/slices/authSlice'
import appReducer from '@/store/slices/appSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        app: appReducer,
    },
    devTools: process.env.NODE_ENV !== 'production',
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

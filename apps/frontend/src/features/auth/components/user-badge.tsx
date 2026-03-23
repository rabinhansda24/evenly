"use client";
import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { fetchCurrentUser, logoutUser } from "../../../../store/thunks/authThunks";

export function UserBadge() {
    const dispatch = useAppDispatch();
    const user = useAppSelector(s => s.auth.user);
    const status = useAppSelector(s => s.auth.status);

    useEffect(() => {
        if (status === 'idle') {
            void dispatch(fetchCurrentUser());
        }
    }, [dispatch, status]);

    if (status === 'idle' || status === 'loading') return <span>Loading...</span>;

    if (user) {
        return (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span>Hello, {user.name}</span>
                <button onClick={() => void dispatch(logoutUser())} aria-label="Logout">
                    Logout
                </button>
            </div>
        );
    }

    return <a href="/login">Sign in</a>;
}

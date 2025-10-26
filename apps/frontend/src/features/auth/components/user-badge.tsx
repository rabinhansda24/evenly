"use client";
import React from "react";
import { apiUrl } from "../../../lib/api";

type PublicUser = {
    id: string;
    email: string;
    name: string;
};

export function UserBadge() {
    const [loading, setLoading] = React.useState(true);
    const [user, setUser] = React.useState<PublicUser | null>(null);

    const loadMe = React.useCallback(async () => {
        try {
            const res = await fetch(apiUrl("/api/auth/me"), {
                credentials: "include",
            });
            if (res.ok) {
                const data = (await res.json()) as PublicUser;
                setUser(data);
            } else {
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadMe();
    }, [loadMe]);

    const onLogout = async () => {
        await fetch(apiUrl("/api/auth/logout"), {
            method: "POST",
            credentials: "include",
        });
        // Re-validate session
        setLoading(true);
        await loadMe();
    };

    if (loading) return <span>Loading...</span>;

    if (user) {
        return (
            <div>
                <span>Hello, {user.name}</span>
                <button onClick={onLogout} aria-label="Logout">Logout</button>
            </div>
        );
    }

    return (
        <a href="/login">Sign in</a>
    );
}

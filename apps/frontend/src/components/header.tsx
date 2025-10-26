"use client";
import React from "react";
import { UserBadge } from "../features/auth/components/user-badge";

export function Header() {
    const appName = process.env.NEXT_PUBLIC_APP_NAME || "App";
    return (
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 1rem", borderBottom: "1px solid #eee" }}>
            <div>{appName}</div>
            <UserBadge />
        </header>
    );
}

export default Header;

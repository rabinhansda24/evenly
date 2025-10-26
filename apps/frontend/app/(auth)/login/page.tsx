"use client";
import LoginForm from "@/features/auth/components/login-form";
import { apiUrl } from "@/lib/api";
import { useState } from "react";

export default function LoginPage() {
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(data: { email: string; password: string }) {
        setMessage(null);
        setError(null);
        const res = await fetch(apiUrl("/api/auth/login"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
        });
        if (res.ok) {
            const user = await res.json();
            setMessage(`Welcome, ${user.name}`);
        } else {
            const body = await res.json().catch(() => ({}));
            setError(body?.error?.message || "Login failed");
        }
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-xl font-semibold mb-4">Login</h1>
            <LoginForm onSubmit={handleSubmit} />
            {message && <p role="status">{message}</p>}
            {error && <p role="alert">{error}</p>}
        </div>
    );
}

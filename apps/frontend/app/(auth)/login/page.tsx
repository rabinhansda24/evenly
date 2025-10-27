"use client";
import LoginForm from "@/features/auth/components/login-form";
import { apiUrl } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [checking, setChecking] = useState(true);

    // If a valid session cookie exists, redirect to dashboard
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(apiUrl("/api/auth/me"), { credentials: "include" });
                if (!cancelled && res.ok) {
                    router.replace("/dashboard");
                    return;
                }
            } catch {
                // ignore
            } finally {
                if (!cancelled) setChecking(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [router]);

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
            // Successful login -> go to dashboard
            router.replace("/dashboard");
            return;
        } else {
            const body = await res.json().catch(() => ({}));
            setError(body?.error?.message || "Login failed");
        }
    }

    return (
        <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-8">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>Welcome back to Evenly</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {checking ? (
                        <p className="text-sm text-muted-foreground">Checking your session…</p>
                    ) : (
                        <LoginForm onSubmit={handleSubmit} />
                    )}
                    {message && (
                        <Alert role="status" className="border-green-300 text-green-700">
                            <AlertDescription>{message}</AlertDescription>
                        </Alert>
                    )}
                    {error && (
                        <Alert role="alert" className="border-red-300 text-red-700">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <p className="text-sm text-muted-foreground">
                        New to Evenly?{" "}
                        <Link href="/register" className="text-primary underline-offset-2 hover:underline">
                            Create an account
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

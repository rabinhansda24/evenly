"use client";
import RegisterForm from "@/features/auth/components/register-form";
import { apiUrl } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RegisterPage() {
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(data: { email: string; name: string; password: string }) {
        setMessage(null);
        setError(null);
        const res = await fetch(apiUrl("/api/auth/register"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
        });
        if (res.status === 201) {
            const user = await res.json();
            setMessage(`Registered ${user.email}`);
        } else {
            const body = await res.json().catch(() => ({}));
            setError(body?.error?.message || "Registration failed");
        }
    }

    return (
        <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-8">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle>Register</CardTitle>
                    <CardDescription>Create your Evenly account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <RegisterForm onSubmit={handleSubmit} />
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
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary underline-offset-2 hover:underline">
                            Log in
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

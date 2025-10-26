import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";

// Intentionally import a component that doesn't exist yet (Red 2)
import { Header } from "../../../../components/header";

const originalFetch = global.fetch;
const APP_NAME = "Evenly";

describe("Header integration (UserBadge + app name)", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        // Simulate NEXT_PUBLIC env usage
        process.env.NEXT_PUBLIC_APP_NAME = APP_NAME;
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it("shows app name and greets user when authenticated", async () => {
        // /me returns user
        // @ts-expect-error minimal Response-like stub
        global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: "u1", email: "a@example.com", name: "Alice" }) });

        render(<Header />);

        // App name from env
        expect(screen.getByText(APP_NAME)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/hello, alice/i)).toBeInTheDocument();
        });
    });

    it("logout posts to /api/auth/logout and then shows Sign in", async () => {
        const fetchMock = vi.fn()
            // initial /me
            .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: "u1", email: "a@example.com", name: "Alice" }) })
            // logout
            .mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) })
            // revalidate /me
            .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: { code: "NO_AUTH" } }) });
        // @ts-expect-error minimal stub
        global.fetch = fetchMock;

        render(<Header />);

        await waitFor(() => {
            expect(screen.getByText(/hello, alice/i)).toBeInTheDocument();
        });

        const logoutBtn = screen.getByRole("button", { name: /logout/i });
        fireEvent.click(logoutBtn);

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringMatching(/\/api\/auth\/logout$/),
                expect.objectContaining({ method: "POST", credentials: "include" })
            );
            expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
        });
    });
});

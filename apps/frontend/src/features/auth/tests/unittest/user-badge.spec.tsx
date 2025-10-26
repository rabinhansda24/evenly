import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";

// Component under test (to be implemented in next step)
import { UserBadge } from "../../components/user-badge";

const originalFetch = global.fetch;

function mockFetchOnce(res: Partial<Response> & { json?: () => Promise<any> }) {
    // Minimal fetch stub
    // @ts-expect-error - we are creating a minimal Response-like object
    global.fetch = vi.fn().mockResolvedValue({
        ok: res.ok ?? true,
        status: res.status ?? 200,
        json: res.json ?? (async () => ({})),
    });
}

describe("UserBadge", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it("renders user name after fetching /api/auth/me", async () => {
        mockFetchOnce({
            ok: true,
            status: 200,
            json: async () => ({ id: "u1", email: "a@example.com", name: "Alice" }),
        });

        render(<UserBadge />);

        // shows a loading state first
        expect(screen.getByText(/loading/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/hello, alice/i)).toBeInTheDocument();
        });

        // ensure fetch was called with credentials include
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringMatching(/\/api\/auth\/me$/),
            expect.objectContaining({ credentials: "include" })
        );
    });

    it("shows Sign in when unauthenticated (401)", async () => {
        mockFetchOnce({ ok: false, status: 401, json: async () => ({ error: { code: "NO_AUTH" } }) });

        render(<UserBadge />);

        await waitFor(() => {
            expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
        });
    });

    it("clicking Logout posts to /api/auth/logout and then shows Sign in", async () => {
        // First call: /me -> authenticated
        const fetchMock = vi.fn()
            .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: "u1", email: "a@example.com", name: "Alice" }) })
            // Second call: /logout
            .mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) })
            // Third call: revalidation /me -> unauthenticated
            .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: { code: "NO_AUTH" } }) });
        // @ts-expect-error - assign minimal stub
        global.fetch = fetchMock;

        render(<UserBadge />);

        await waitFor(() => {
            expect(screen.getByText(/hello, alice/i)).toBeInTheDocument();
        });

        const btn = screen.getByRole("button", { name: /logout/i });
        fireEvent.click(btn);

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringMatching(/\/api\/auth\/logout$/),
                expect.objectContaining({ method: "POST", credentials: "include" })
            );
            expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
        });
    });
});

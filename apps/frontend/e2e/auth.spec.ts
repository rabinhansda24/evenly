/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-expect-error - types resolved when Playwright is installed
import { test, expect } from '@playwright/test';

function uniqueEmail() {
    return `e2e_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
}

async function stubAuthApi(page: any, opts?: { meStatus?: number }) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const meStatus = opts?.meStatus ?? 401;

    await page.route(`${apiBase}/api/auth/me`, async (route: any) => {
        if (meStatus === 200) {
            await route.fulfill({ status: 200, body: JSON.stringify({ id: 'u1', email: 'a@example.com', name: 'Alice' }), headers: { 'Content-Type': 'application/json' } });
        } else {
            await route.fulfill({ status: 401, body: JSON.stringify({ error: { code: 'NO_AUTH' } }), headers: { 'Content-Type': 'application/json' } });
        }
    });

    await page.route(`${apiBase}/api/auth/register`, async (route: any) => {
        const post = await route.request().postDataJSON().catch(() => ({}));
        await route.fulfill({ status: 201, body: JSON.stringify({ id: 'new', email: post?.email ?? 'user@example.com', name: post?.name ?? 'User' }), headers: { 'Content-Type': 'application/json' } });
    });

    await page.route(`${apiBase}/api/auth/login`, async (route: any) => {
        const post = await route.request().postDataJSON().catch(() => ({}));
        await route.fulfill({ status: 200, body: JSON.stringify({ id: 'u1', email: post?.email ?? 'user@example.com', name: 'User' }), headers: { 'Content-Type': 'application/json' } });
    });
}

test.describe('Auth flow', () => {
    test('register redirects to login', async ({ page }: { page: any }) => {
        const email = uniqueEmail();

        await stubAuthApi(page, { meStatus: 401 });
        await page.goto('/register');

        await page.getByLabel(/email/i).fill(email);
        await page.getByLabel(/name/i).fill('E2E User');
        await page.getByLabel(/password/i).fill('Password123!');
        await page.getByRole('button', { name: /sign up|register/i }).click();

        await expect(page).toHaveURL(/\/login$/);
        await expect(page.getByRole('heading', { name: /login/i })).toBeVisible({ timeout: 5000 });
    });

    test('login redirects to dashboard', async ({ page }: { page: any }) => {
        const email = uniqueEmail();

        await stubAuthApi(page, { meStatus: 401 });

        // Register first
        await page.goto('/register');
        await page.getByLabel(/email/i).fill(email);
        await page.getByLabel(/name/i).fill('E2E User');
        await page.getByLabel(/password/i).fill('Password123!');
        await page.getByRole('button', { name: /sign up|register/i }).click();
        await expect(page).toHaveURL(/\/login$/);

        // Login
        await page.getByLabel(/email/i).fill(email);
        await page.getByLabel(/password/i).fill('Password123!');
        await page.getByRole('button', { name: /log in|sign in/i }).click();

        await expect(page).toHaveURL(/\/dashboard$/);
    });
});

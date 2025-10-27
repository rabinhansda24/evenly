import { test, expect } from '@playwright/test';

function uniqueEmail() {
    return `e2e_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
}

test.describe('Auth flow', () => {
    test('register redirects to login', async ({ page }) => {
        const email = uniqueEmail();
        await page.goto('/register');

        await page.getByLabel(/email/i).fill(email);
        await page.getByLabel(/name/i).fill('E2E User');
        await page.getByLabel(/password/i).fill('Password123!');
        await page.getByRole('button', { name: /sign up|register/i }).click();

        await expect(page).toHaveURL(/\/login$/);
        await expect(page.getByRole('heading', { name: /login/i })).toBeVisible({ timeout: 5000 });
    });

    test('login redirects to dashboard', async ({ page }) => {
        const email = uniqueEmail();

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

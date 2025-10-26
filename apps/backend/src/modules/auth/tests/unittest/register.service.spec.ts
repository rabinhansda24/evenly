import { describe, it, expect } from "vitest";
import { registerUser } from "../../service/register.service";
import type { RegisterInput } from "../../dto/register.dto";

/**
 * Red 1 — Unit test for user registration service
 * Intentionally imports non-existent production code to drive TDD.
 * This should fail until we implement:
 *  - src/modules/auth/dto/register.dto (RegisterInput)
 *  - src/modules/auth/service/register.service (registerUser)
 */
describe("auth: registerUser (service)", () => {
    it("returns user without password and with an id", async () => {
        const input: RegisterInput = {
            email: "alice@example.com",
            name: "Alice",
            password: "Password123!",
        };

        const user = await registerUser(input);

        // Expect an id and same public fields
        expect(user).toMatchObject({ email: input.email, name: input.name });
        expect(user).toHaveProperty("id");
        // Never expose password hash via service return
        // (service can persist hash internally, but shouldn't return it)
        expect((user as any).password).toBeUndefined();
        expect((user as any).passwordHash).toBeUndefined();
    });
});

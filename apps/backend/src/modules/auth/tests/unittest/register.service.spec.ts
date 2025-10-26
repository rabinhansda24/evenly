import { describe, it, expect, beforeEach, vi } from "vitest";
import type { RegisterInput } from "../../dto/register.dto";
// Hoist-safe construction of DB mock for this spec file
const { moduleExports } = vi.hoisted(() => {
    // use require in hoisted factory per Vitest docs
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { buildDbMock } = require("../../../../test-utils/db.mock.cjs");
    const built = buildDbMock();
    return { moduleExports: built.moduleExports };
});
vi.mock("../../../../db/index.js", () => moduleExports);

// Import after mocks so the service picks up the mocked DB
import { registerUser, UserExistsError } from "../../service/register.service";
// Grab mock state from the mocked module exports
// @ts-ignore - exported only by the mock
import { __state as dbMockState } from "../../../../db/index.js";

/**
 * Red 1 — Unit test for user registration service
 * Intentionally imports non-existent production code to drive TDD.
 * This should fail until we implement:
 *  - src/modules/auth/dto/register.dto (RegisterInput)
 *  - src/modules/auth/service/register.service (registerUser)
 */
describe("auth: registerUser (service)", () => {
    beforeEach(() => {
        // reset mock state before each test
        dbMockState.findExisting = false;
        dbMockState.lastInserted = null;
    });
    it("returns user without password and with an id", async () => {
        const unique = Math.random().toString(36).slice(2);
        const input: RegisterInput = {
            email: `alice+${unique}@example.com`,
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

    it("throws UserExistsError when email already exists", async () => {
        dbMockState.findExisting = true; // simulate existing user found by select
        const input: RegisterInput = {
            email: `bob@example.com`,
            name: "Bob",
            password: "Password123!",
        };

        await expect(registerUser(input)).rejects.toBeInstanceOf(UserExistsError);
    });
});

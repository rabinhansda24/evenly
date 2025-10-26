import { describe, it, expect, vi } from "vitest";
import { scryptSync } from "crypto";

// Hoist-safe DB mock for login service unit tests
const { moduleExports } = vi.hoisted(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { buildDbMock } = require("../../../../test-utils/db.mock.cjs");
    const built = buildDbMock();
    return { moduleExports: built.moduleExports };
});
vi.mock("../../../../db/index.js", () => moduleExports);

// Import after mocks so the service picks up the mocked DB
import type { LoginInput } from "../../dto/login.dto";
import { loginUser } from "../../service/login.service";
// @ts-ignore pull mock state for controlling selected user
import { __state as dbMockState } from "../../../../db/index.js";

describe("auth: loginUser (service)", () => {
    it("returns public user when email+password are valid", async () => {
        const email = `alice.login@example.com`;
        const name = "Alice";
        const password = "Password123!";

        // Prepare a passwordHash in the same format expected by the service: salt:derivedHex
        const salt = "cafebabe"; // fixed salt for determinism
        const derived = scryptSync(password, salt, 64).toString("hex");
        const passwordHash = `${salt}:${derived}`;

        // Configure mock DB to return an existing user with the above hash
        dbMockState.findExisting = true;
        dbMockState.selectedUser = {
            id: "u_test_login",
            email,
            name,
            passwordHash,
        };

        const input: LoginInput = { email, password };
        const user = await loginUser(input);

        expect(user).toMatchObject({ email, name });
        expect(user).toHaveProperty("id");
        expect((user as any).passwordHash).toBeUndefined();
        expect((user as any).password).toBeUndefined();
    });
});

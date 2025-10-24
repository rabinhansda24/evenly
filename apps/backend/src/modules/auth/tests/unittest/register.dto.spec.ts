import { describe, it, expect } from "vitest";
import { RegisterDto } from "../../validators/register.dto";

describe("auth RegisterDto (schema)", () => {
    it("fails on invalid email", () => {
        const res = RegisterDto.safeParse({ email: "bad", name: "Al", password: "password1" });
        expect(res.success).toBe(false);
    });

    it("fails when password is too short", () => {
        const res = RegisterDto.safeParse({ email: "a@b.com", name: "Alice", password: "short" });
        expect(res.success).toBe(false);
    });

    it("accepts a valid payload", () => {
        const res = RegisterDto.safeParse({ email: "a@b.com", name: "Alice", password: "password1" });
        expect(res.success).toBe(true);
    });
});

import { describe, it, expect } from "vitest";
import { z } from "zod";

const RegisterDto = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8)
});

describe("auth RegisterDto", () => {
  it("fails on invalid email", () => {
    const res = RegisterDto.safeParse({ email: "bad", name: "aa", password: "password1" });
    expect(res.success).toBe(false);
  });

  it("accepts valid payload", () => {
    const res = RegisterDto.safeParse({ email: "a@b.com", name: "Alice", password: "password1" });
    expect(res.success).toBe(true);
  });
});

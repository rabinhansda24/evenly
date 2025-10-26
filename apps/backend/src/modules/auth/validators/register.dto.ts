import { z } from "zod";

export const RegisterDto = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    password: z.string().min(8),
});

export type RegisterInput = z.infer<typeof RegisterDto>;

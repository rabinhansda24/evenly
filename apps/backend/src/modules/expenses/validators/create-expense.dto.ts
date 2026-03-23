import { z } from "zod";

export const CreateExpenseDto = z.object({
    description: z.string().min(1).max(300),
    amount: z.number().positive(),
    paidById: z.string().uuid(),
    category: z.string().max(50).default("general"),
    splitMode: z.enum(["equal", "weights", "fixed"]).default("equal"),
    participants: z.array(z.object({
        userId: z.string().uuid(),
        share: z.number().nonnegative().optional(),
        weight: z.number().positive().optional(),
    })).min(1),
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseDto>;

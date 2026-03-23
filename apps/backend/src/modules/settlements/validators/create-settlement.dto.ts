import { z } from "zod";

export const CreateSettlementDto = z.object({
    toUserId: z.string().uuid(),
    amount: z.number().positive(),
    description: z.string().max(300).optional(),
});

export type CreateSettlementInput = z.infer<typeof CreateSettlementDto>;

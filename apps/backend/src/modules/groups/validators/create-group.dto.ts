import { z } from "zod";

export const CreateGroupDto = z.object({
    name: z.string().trim().min(1, "Name is required"),
    description: z.string().trim().optional(),
});

export type CreateGroupInput = z.infer<typeof CreateGroupDto>;

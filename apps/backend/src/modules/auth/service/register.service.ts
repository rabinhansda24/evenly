import { randomUUID } from "crypto";
import type { RegisterInput } from "../dto/register.dto";

type PublicUser = {
    id: string;
    email: string;
    name: string;
};

// Minimal implementation to satisfy Red 1 unit test
export async function registerUser(input: RegisterInput): Promise<PublicUser> {
    return {
        id: randomUUID(),
        email: input.email,
        name: input.name,
    };
}

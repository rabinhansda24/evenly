import type { RegisterInput } from "../dto/register.dto";
import { randomBytes, scryptSync } from "crypto";
import { getDatabase, users } from "../../../db/index.js";
import { eq } from "drizzle-orm";

type PublicUser = {
    id: string;
    email: string;
    name: string;
};

export class UserExistsError extends Error {
    constructor(message = "User already exists") {
        super(message);
        this.name = "UserExistsError";
    }
}

// Production implementation to satisfy integration tests
export async function registerUser(input: RegisterInput): Promise<PublicUser> {
    const db = getDatabase().getDb();

    // Check duplicate by exact email (DB also has unique constraint)
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
    if (existing.length > 0) {
        throw new UserExistsError();
    }

    const passwordHash = hashPassword(input.password);

    // Insert and return public projection
    const inserted = await db
        .insert(users)
        .values({ email: input.email, name: input.name, passwordHash })
        .returning({ id: users.id, email: users.email, name: users.name });

    return inserted[0];
}

function hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const derived = scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${derived}`;
}

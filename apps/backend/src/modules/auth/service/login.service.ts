import type { LoginInput } from "../dto/login.dto";
import { scryptSync, timingSafeEqual } from "crypto";
import { getDatabase, users } from "../../../db/index.js";
import { eq } from "drizzle-orm";

type PublicUser = {
    id: string;
    email: string;
    name: string;
};

export class InvalidCredentialsError extends Error {
    constructor(message = "Invalid credentials") {
        super(message);
        this.name = "InvalidCredentialsError";
    }
}

export async function loginUser(input: LoginInput): Promise<PublicUser> {
    const db = getDatabase().getDb();

    // Fetch user by email; select passwordHash for verification
    const rows = await db
        .select({ id: users.id, email: users.email, name: users.name, passwordHash: (users as any).passwordHash })
        .from(users)
        .where(eq((users as any).email, input.email))
        .limit(1);

    if (rows.length === 0) {
        throw new InvalidCredentialsError();
    }

    const row: any = rows[0];
    if (!row.passwordHash || typeof row.passwordHash !== "string") {
        throw new InvalidCredentialsError();
    }

    if (!verifyPassword(input.password, row.passwordHash)) {
        throw new InvalidCredentialsError();
    }

    return { id: row.id, email: row.email, name: row.name };
}

function verifyPassword(plain: string, stored: string): boolean {
    const [salt, derivedHex] = stored.split(":");
    if (!salt || !derivedHex) return false;
    const computed = scryptSync(plain, salt, 64);
    try {
        return timingSafeEqual(Buffer.from(derivedHex, "hex"), computed);
    } catch {
        return false;
    }
}

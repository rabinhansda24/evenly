import type { SessionPayload } from "../modules/auth/lib/session.js";

declare global {
    namespace Express {
        interface Request {
            user?: SessionPayload;
        }
    }
}

import type { Response, Request, NextFunction } from "express";
import jwt from "jsonwebtoken";

const COOKIE_NAME = "session";

export type SessionPayload = {
    id: string;
    email: string;
    name: string;
};

function getSecret(): string {
    return process.env.JWT_SECRET || process.env.AUTH_SECRET || "dev_session_secret";
}

export function setSessionCookie(res: Response, payload: SessionPayload) {
    const token = jwt.sign(payload, getSecret(), { expiresIn: "7d" });
    const isProd = process.env.NODE_ENV === "production";
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "lax" : "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}

export function clearSessionCookie(res: Response) {
    res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function authenticate(req: Request & { user?: SessionPayload }, res: Response, next: NextFunction) {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
        return res.status(401).json({ error: { code: "NO_AUTH", message: "Missing session" } });
    }
    try {
        const decoded = jwt.verify(token, getSecret()) as SessionPayload;
        req.user = decoded;
        return next();
    } catch (err) {
        return res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Invalid session" } });
    }
}

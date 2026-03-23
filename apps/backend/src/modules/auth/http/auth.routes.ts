import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { RegisterDto } from "../validators/register.dto.js";
import { registerUser, UserExistsError } from "../service/register.service.js";
import { LoginDto } from "../validators/login.dto.js";
import { loginUser, InvalidCredentialsError } from "../service/login.service.js";
import { authenticate, setSessionCookie, clearSessionCookie } from "../lib/session.js";

export const router: Router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: { code: "RATE_LIMITED", message: "Too many requests, please try again later" } },
});

router.post("/register", authLimiter, async (req: Request, res: Response) => {
  const parsed = RegisterDto.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid payload" } });
  }
  try {
    const publicUser = await registerUser(parsed.data);
    return res.status(201).json(publicUser);
  } catch (err: any) {
    if (err instanceof UserExistsError) {
      return res.status(409).json({ error: { code: "USER_EXISTS", message: "Email already registered" } });
    }
    console.error("/register error:", err);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong" } });
  }
});

router.post("/login", authLimiter, async (req: Request, res: Response) => {
  const parsed = LoginDto.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid payload" } });
  }
  try {
    const publicUser = await loginUser(parsed.data);
    setSessionCookie(res, publicUser);
    return res.status(200).json(publicUser);
  } catch (err: any) {
    if (err instanceof InvalidCredentialsError) {
      return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
    }
    console.error("/login error:", err);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong" } });
  }
});

router.get("/me", authenticate, async (req: Request, res: Response) => {
  return res.status(200).json(req.user);
});

router.post("/logout", async (_req: Request, res: Response) => {
  clearSessionCookie(res);
  return res.status(204).send();
});

export default router;

import { Router, Request, Response } from "express";
import { RegisterDto } from "../validators/register.dto.js";
import { registerUser, UserExistsError } from "../service/register.service.js";
import { LoginDto } from "../validators/login.dto.js";
import { loginUser, InvalidCredentialsError } from "../service/login.service.js";
import { authenticate, setSessionCookie } from "../lib/session.js";

export const router: Router = Router();

router.post("/register", async (req: Request, res: Response) => {
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

router.post("/login", async (req: Request, res: Response) => {
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

router.get("/me", authenticate, async (req: any, res: Response) => {
  const user = req.user;
  return res.status(200).json(user);
});

export default router;

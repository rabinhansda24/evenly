import { Router, Request, Response } from "express";
import { z } from "zod";

export const router: Router = Router();

const RegisterDto = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8)
});

router.post("/register", (req: Request, res: Response) => {
  const parsed = RegisterDto.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid payload" } });
  }
  return res.status(201).json({ id: "stub", email: parsed.data.email, name: parsed.data.name });
});

export default router;

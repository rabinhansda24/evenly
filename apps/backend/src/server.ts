import express, { Application } from "express";
import { router as authRouter } from "./modules/auth/http/auth.routes.js";

const app: Application = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Evenly backend listening on :${port}`));
export default app;

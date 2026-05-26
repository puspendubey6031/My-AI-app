import { Router } from "express";
import { PLANS } from "../config/plans";

const router = Router();

router.get("/plans", (req, res) => {
  res.json(PLANS);
});

export default router;

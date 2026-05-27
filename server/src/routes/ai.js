import { Router } from "express";
import {
  getSprintPlan,
  getCodeReview,
} from "../controllers/aiController.js";
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/sprint", getSprintPlan);
router.get("/review", getCodeReview);

export default router;

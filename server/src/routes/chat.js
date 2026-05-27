import { Router } from "express";
import {
  getMessages,
  sendMessage,
  addReaction,
} from "../controllers/chatController.js";
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getMessages);
router.post("/", sendMessage);
router.post("/:messageId/react", addReaction);

export default router;

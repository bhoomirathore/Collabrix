import { Router } from "express";
import {
  getWorkspaces,
  createWorkspace,
  getWorkspaceMembers,
  inviteMember,
  getBilling,
} from "../controllers/workspaceController.js";
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getWorkspaces);
router.post("/", createWorkspace);
router.get("/:workspaceId/members", getWorkspaceMembers);
router.post("/:workspaceId/invite", inviteMember);
router.get("/:workspaceId/billing", getBilling);

export default router;

import { Router } from "express";
import {
  getWikis,
  createWiki,
  updateWiki,
  getSnippets,
  createSnippet,
  getResources,
  createResource,
  saveResource,
  getEvents,
} from "../controllers/engineeringController.js";
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

// Wiki routes
router.get("/wikis", getWikis);
router.post("/wikis", createWiki);
router.patch("/wikis/:id", updateWiki);

// Snippet routes
router.get("/snippets", getSnippets);
router.post("/snippets", createSnippet);

// Resource routes
router.get("/resources", getResources);
router.post("/resources", createResource);
router.post("/resources/:id/save", saveResource);

// Timeline Events
router.get("/events", getEvents);

export default router;

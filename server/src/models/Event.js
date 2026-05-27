import { createModel } from "./modelFactory.js";

const eventSchemaDef = {
  type: {
    type: String,
    required: true, // task_completed, task_moved, commit_pushed, wiki_updated, snippet_created, resource_saved, ai_review_generated, chat_highlight
  },
  message: {
    type: String,
    required: true,
  },
  user: {
    type: String, // User ID reference
    required: true,
  },
  workspaceId: {
    type: String,
    required: true,
  },
  targetType: {
    type: String,
    default: "", // task, snippet, wiki, resource, review, billing
  },
  targetId: {
    type: String,
    default: "",
  },
  meta: {
    type: Object,
    default: {}, // Store extra keys (sprintName, priority, language, etc.)
  },
};

const Event = createModel("Event", eventSchemaDef, "events");

export default Event;

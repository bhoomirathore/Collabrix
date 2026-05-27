import { createModel } from "./modelFactory.js";

const resourceSchemaDef = {
  title: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: "tool", // tool, repository, article, learning
  },
  description: {
    type: String,
    default: "",
  },
  annotation: {
    type: String,
    default: "", // "why this matters"
  },
  savedBy: [{
    type: String, // Array of User IDs
  }],
  workspaceId: {
    type: String,
    required: true,
  },
  associatedTask: {
    type: String,
    default: "", // e.g. "WebSocket Reconnect Task"
  },
  sprint: {
    type: String,
    default: "", // e.g. "Sprint 3"
  },
};

const Resource = createModel("Resource", resourceSchemaDef, "resources");

export default Resource;

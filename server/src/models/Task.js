import { createModel } from "./modelFactory.js";

const taskSchemaDef = {
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    default: "todo", // backlog, todo, in_progress, review, done
  },
  priority: {
    type: String,
    default: "medium", // low, medium, high, urgent
  },
  assignee: {
    type: String, // User ID reference
    default: null,
  },
  workspaceId: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: "general", // frontend, backend, devops, ai, docs
  },
  sprint: {
    type: String,
    default: "Sprint 1",
  },
  storyPoints: {
    type: Number,
    default: 1,
  },
};

const Task = createModel("Task", taskSchemaDef, "tasks");

export default Task;

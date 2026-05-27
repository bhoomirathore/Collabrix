import { createModel } from "./modelFactory.js";

const snippetSchemaDef = {
  title: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    default: "javascript",
  },
  author: {
    type: String, // User ID reference
    required: true,
  },
  workspaceId: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
};

const Snippet = createModel("Snippet", snippetSchemaDef, "snippets");

export default Snippet;

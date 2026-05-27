import { createModel } from "./modelFactory.js";

const wikiSchemaDef = {
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: String, // User ID reference
    required: true,
  },
  workspaceId: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
};

const Wiki = createModel("Wiki", wikiSchemaDef, "wikis");

export default Wiki;

import { createModel } from "./modelFactory.js";

const workspaceSchemaDef = {
  name: {
    type: String,
    required: true,
    trim: true,
  },
  owner: {
    type: String, // String ID for fallback simplicity
    required: true,
  },
  members: [{
    type: String,
  }],
  tier: {
    type: String,
    default: "pro", // free, pro, enterprise
  },
};

const Workspace = createModel("Workspace", workspaceSchemaDef, "workspaces");

export default Workspace;

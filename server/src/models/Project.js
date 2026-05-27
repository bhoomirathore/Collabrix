import { createModel } from "./modelFactory.js";

const projectSchemaDef = {
  name: {
    type: String,
    required: true,
  },
  workspaceId: {
    type: String,
    required: true,
  },
};

const Project = createModel("Project", projectSchemaDef, "projects");

export default Project;

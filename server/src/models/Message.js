import { createModel } from "./modelFactory.js";

const messageSchemaDef = {
  text: {
    type: String,
    required: true,
  },
  sender: {
    type: String, // User ID reference
    required: true,
  },
  workspaceId: {
    type: String,
    required: true,
  },
  reactions: [{
    emoji: String,
    users: [String], // Array of User IDs who reacted
  }],
  attachments: [{
    type: { type: String }, // snippet, resource, wiki, task
    id: String,
    name: String,
  }],
};

const Message = createModel("Message", messageSchemaDef, "messages");

export default Message;

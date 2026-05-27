import { createModel } from "./modelFactory.js";

const userSchemaDef = {
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  avatar: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    default: "online", // online, away, busy, offline
  },
  customStatus: {
    type: String,
    default: "",
  }
};

const User = createModel("User", userSchemaDef, "users");

export default User;
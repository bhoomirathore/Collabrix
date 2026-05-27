import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth.js";
import workspaceRoutes from "./routes/workspaces.js";
import taskRoutes from "./routes/tasks.js";
import chatRoutes from "./routes/chat.js";
import aiRoutes from "./routes/ai.js";
import engineeringRoutes from "./routes/engineering.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    message: "Collabrix API running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/engineering", engineeringRoutes);

export default app;
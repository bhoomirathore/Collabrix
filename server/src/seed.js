import bcrypt from "bcrypt";
import User from "./models/User.js";
import Workspace from "./models/Workspace.js";
import Task from "./models/Task.js";
import Message from "./models/Message.js";
import Wiki from "./models/Wiki.js";
import Snippet from "./models/Snippet.js";
import Resource from "./models/Resource.js";
import Event from "./models/Event.js";
import { saveData } from "./models/mockDb.js";

const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log("Database already has data. Skipping seed.");
      return;
    }

    console.log("🌱 Seeding realistic collaborative engineering database...");

    const passwordHash = await bcrypt.hash("password123", 10);

    // 1. Seed Users
    const bhoomi = await User.create({
      name: "Bhoomi Rathore",
      email: "bhoomi@collabrix.dev",
      password: passwordHash,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      status: "online",
      customStatus: "🚀 working on Vite bundle sizes",
    });

    const aryan = await User.create({
      name: "Aryan Patel",
      email: "aryan@collabrix.dev",
      password: passwordHash,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      status: "busy",
      customStatus: "🛠️ debugging websocket handshakes",
    });

    const sarah = await User.create({
      name: "Sarah Jenkins",
      email: "sarah@collabrix.dev",
      password: passwordHash,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      status: "away",
      customStatus: "☕ AFK for a moment",
    });

    const ai = await User.create({
      name: "Collabrix AI",
      email: "ai@collabrix.dev",
      password: passwordHash,
      avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      status: "online",
      customStatus: "🤖 Ready to review PRs",
    });

    // 2. Seed Default Workspace
    const workspace = await Workspace.create({
      name: "Collabrix Core",
      owner: bhoomi._id,
      members: [bhoomi._id, aryan._id, sarah._id, ai._id],
      tier: "pro",
    });

    const workspaceId = workspace._id;

    // 3. Seed Tasks
    const task1 = await Task.create({
      title: "Fix WebSocket reconnect failing after refresh",
      description: "When refreshing the page, the socket client drops connectivity and fails to automatically renegotiate handshake headers if the JWT token is near expiry. Need to refresh token in handshake middleware.",
      status: "in_progress",
      priority: "high",
      assignee: aryan._id,
      workspaceId,
      category: "backend",
      sprint: "Sprint 3: Core Reliability",
      storyPoints: 3,
    });

    const task2 = await Task.create({
      title: "JWT rotation strategy & blacklist token verification",
      description: "Implement silent token refreshes and verify blacklisted tokens using Redis key expiration. This solves our multi-tab session expiry issues and increases auth safety.",
      status: "review",
      priority: "urgent",
      assignee: sarah._id,
      workspaceId,
      category: "backend",
      sprint: "Sprint 3: Core Reliability",
      storyPoints: 5,
    });

    const task3 = await Task.create({
      title: "Vite optimization and asset bundle size reduction",
      description: "Split vendors out into distinct chunks and utilize compression plugins. Reduces landing load time by 40%.",
      status: "done",
      priority: "low",
      assignee: bhoomi._id,
      workspaceId,
      category: "frontend",
      sprint: "Sprint 3: Core Reliability",
      storyPoints: 2,
    });

    const task4 = await Task.create({
      title: "Redis adapter for pub/sub horizontal scaling",
      description: "Transition our direct in-memory WebSocket event dispatching to utilize a Redis Pub/Sub adapter to allow multi-instance socket synchronization.",
      status: "todo",
      priority: "high",
      assignee: aryan._id,
      workspaceId,
      category: "devops",
      sprint: "Sprint 3: Core Reliability",
      storyPoints: 8,
    });

    const task5 = await Task.create({
      title: "Document deployment architecture and failover playbooks",
      description: "Write explicit deployment wiki notes outlining Docker Compose setups, Nginx reversions, and Redis master-slave syncing.",
      status: "todo",
      priority: "medium",
      assignee: bhoomi._id,
      workspaceId,
      category: "docs",
      sprint: "Sprint 3: Core Reliability",
      storyPoints: 3,
    });

    // 4. Seed Wiki Pages
    const wiki1 = await Wiki.create({
      title: "Deployment Architecture",
      content: `# Production Deployment Architecture

This document describes the high-availability deployment structure for the Collabrix Core services.

## Architecture Diagram Overview
\`\`\`
                     [ Nginx Reverse Proxy ]
                               |
            +------------------+------------------+
            |                                     |
   [ Node Instance 1 ]                   [ Node Instance 2 ]
   (Port: 4001, Sockets)                 (Port: 4002, Sockets)
            |                                     |
            +------------------+------------------+
                               |
                     [ Redis Pub/Sub Adapter ]
                               |
                     [ MongoDB Database Cluster ]
\`\`\`

## Failover Strategy & PM2
We utilize PM2 clustering on the production server to fork instances across active CPU cores. If an instance encounters a memory overflow or unhandled rejection, PM2 restarts it immediately with an automated backoff.

### Setup Instructions
1. Run \`pm2 start src/index.js -i max\`
2. Configure Nginx upstream headers to support sticky sessions for Socket.io.
`,
      author: bhoomi._id,
      workspaceId,
      slug: "deployment-architecture",
    });

    const wiki2 = await Wiki.create({
      title: "Auth Decisions & Token Rotation",
      content: `# JWT Auth Decisions and Rotation Architecture

To maintain high security while supporting seamless developer collaboration, we implement stateless JSON Web Tokens with a sliding expiration window.

## Token Policies
- **Access Token Expiry**: 15 minutes
- **Refresh Token Expiry**: 7 days (stored securely in HttpOnly, SameSite cookies)
- **Token Rotation**: Each refresh token exchange invalidates the old refresh token and issues a new pair, mitigating replay attacks.

## Middleware Example
See the **JWT Auth Middleware** snippet inside the Snippets panel for the exact implementation details. Blacklisted keys are stored directly inside our Redis instance with an automatic TTL match.
`,
      author: sarah._id,
      workspaceId,
      slug: "auth-decisions",
    });

    // 5. Seed Snippets
    await Snippet.create({
      title: "JWT Auth Middleware",
      code: `import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Optional check: Ensure token is not in Redis blacklist
    // const isBlacklisted = await redis.get(\`blacklist:\${decoded.jti}\`);
    // if (isBlacklisted) return res.status(401).json({ message: "Token has been revoked" });

    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

export default authMiddleware;`,
      language: "javascript",
      author: sarah._id,
      workspaceId,
      description: "Express route middleware designed to capture Bearer tokens, verify authenticity, and mount decrypted User context.",
    });

    await Snippet.create({
      title: "Socket Auth Connector",
      code: `import { io } from "socket.io-client";

let socket;

export const initiateSocketConnection = (token, workspaceId) => {
  socket = io(import.meta.env.VITE_API_URL.replace("/api", ""), {
    auth: {
      token: \`Bearer \${token}\`,
      workspaceId
    },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("Connected to Realtime Gateway:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("Connection Error:", err.message);
  });

  return socket;
};`,
      language: "javascript",
      author: aryan._id,
      workspaceId,
      description: "Frontend socket connector with robust auto-reconnection configuration and authentication payload delivery.",
    });

    // 6. Seed Resources
    await Resource.create({
      title: "Socket.io Client Resilience Guide",
      url: "https://socket.io/docs/v4/client-offline-behavior/",
      category: "documentation",
      description: "Detailed official manuals for client connection drops, network switching, and reconnection algorithms.",
      annotation: "Aryan: Read this before fixing the reconnect failing. Standard retry timeouts are too long and we need sticky handshakes.",
      savedBy: [aryan._id, bhoomi._id],
      workspaceId,
      associatedTask: "Fix WebSocket reconnect failing after refresh",
      sprint: "Sprint 3: Core Reliability",
    });

    await Resource.create({
      title: "Vite Bundle Analyzer Plugin",
      url: "https://github.com/remcohaszing/rollup-plugin-visualizer",
      category: "tool",
      description: "Visualizes the size of Rollup output files with an interactive zoomable treemap.",
      annotation: "Bhoomi: Use this tool to verify our chunk splitting. I got our core vendor payload down to 180kb!",
      savedBy: [bhoomi._id, sarah._id, aryan._id],
      workspaceId,
      associatedTask: "Vite optimization and asset bundle size reduction",
      sprint: "Sprint 3: Core Reliability",
    });

    // 7. Seed Chat Messages
    await Message.create({
      text: "Hey team! Happy Monday. Let's make sure we stay focused on Sprint 3 reliability goals.",
      sender: bhoomi._id,
      workspaceId,
    });

    await Message.create({
      text: "Socket reconnect is failing after refresh when the JWT token expires. I'm digging into it now.",
      sender: aryan._id,
      workspaceId,
    });

    await Message.create({
      text: "Can someone review auth middleware? I just posted the JWT rotation strategy wiki and shared the code snippet.",
      sender: sarah._id,
      workspaceId,
    });

    await Message.create({
      text: "Redis adapter fixed horizontal scaling. Spun up a local node with 3 client cluster forks, events sync perfectly!",
      sender: aryan._id,
      workspaceId,
    });

    await Message.create({
      text: "Checking Sarah's auth middleware now. I analyzed the JWT rotation schema—the silent HttpOnly refresh flow looks extremely secure. I've added a few optimization notes.",
      sender: ai._id,
      workspaceId,
    });

    // 8. Seed Timeline Events
    await Event.create({
      type: "task_moved",
      message: "Bhoomi Rathore moved 'Vite optimization and asset bundle size reduction' to Done",
      user: bhoomi._id,
      workspaceId,
      targetType: "task",
      targetId: task3._id,
      meta: { category: "frontend", sprint: "Sprint 3" },
    });

    await Event.create({
      type: "wiki_updated",
      message: "Sarah Jenkins updated wiki page: Auth Decisions & Token Rotation",
      user: sarah._id,
      workspaceId,
      targetType: "wiki",
      targetId: wiki2._id,
    });

    await Event.create({
      type: "snippet_created",
      message: "Aryan Patel shared snippet: Socket Auth Connector",
      user: aryan._id,
      workspaceId,
      targetType: "snippet",
    });

    await Event.create({
      type: "ai_review_generated",
      message: "Collabrix AI generated security review for task: JWT rotation strategy",
      user: ai._id,
      workspaceId,
      targetType: "review",
      meta: { rating: "A+", points: 5 },
    });

    await Event.create({
      type: "resource_saved",
      message: "Bhoomi Rathore bookmarked: Vite Bundle Analyzer Plugin",
      user: bhoomi._id,
      workspaceId,
      targetType: "resource",
    });

    // Save mock db store to file
    saveData();
    console.log("🎉 Seeded database successfully!");
  } catch (err) {
    console.error("❌ Seeding database failed:", err.message);
  }
};

export default seedDatabase;

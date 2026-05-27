import { useEffect, useState } from "react";
import { useSearchParams, useOutletContext } from "react-router-dom";
import api from "../lib/axios";

export default function CodeReview() {
  const { tasks } = useOutletContext();
  const [searchParams] = useSearchParams();
  const paramTaskId = searchParams.get("taskId");

  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [loadingReview, setLoadingReview] = useState(false);
  const [reviewReport, setReviewReport] = useState(null);

  // Diffs mapping for seeded tasks
  const diffs = {
    websocket: `diff --git a/client/src/lib/socket.js b/client/src/lib/socket.js
index 4b9e29a..8f21bc9 100644
--- a/client/src/lib/socket.js
+++ b/client/src/lib/socket.js
@@ -10,6 +10,12 @@ export const initiateSocketConnection = (token, workspaceId) => {
   socket = io(import.meta.env.VITE_API_URL.replace("/api", ""), {
     auth: {
-      token: token, // BUG: Sending stale raw token without validation checks
+      token: \`Bearer \${token}\`,
+      workspaceId
     },
-    reconnection: true
+    reconnection: true,
+    reconnectionAttempts: 10,
+    reconnectionDelay: 1000,
+    reconnectionDelayMax: 5000
   });
 
   socket.on("connect", () => {`,
    
    jwt: `diff --git a/server/src/middleware/auth.js b/server/src/middleware/auth.js
index c872eb1..fa10a29 100644
--- a/server/src/middleware/auth.js
+++ b/server/src/middleware/auth.js
@@ -12,6 +12,12 @@ const authMiddleware = async (req, res, next) => {
     const token = authHeader.split(" ")[1];
     const decoded = jwt.verify(token, process.env.JWT_SECRET);
+
+    // SECURE: Validate sliding refresh token blacklists inside Redis
+    const isBlacklisted = await redis.get(\`blacklist:\${decoded.jti}\`);
+    if (isBlacklisted) {
+      return res.status(401).json({ message: "Token has been revoked" });
+    }
     
     req.user = await User.findById(decoded.id).select("-password");
     next();`,
    
    general: `diff --git a/client/src/pages/Dashboard.jsx b/client/src/pages/Dashboard.jsx
index a1278bf..8f7b2c0 100644
--- a/client/src/pages/Dashboard.jsx
+++ b/client/src/pages/Dashboard.jsx
@@ -4,4 +4,4 @@
 export default function Dashboard() {
-  // old layout code
+  // modern tactile grid system optimization
 }`
  };

  useEffect(() => {
    if (paramTaskId) {
      setSelectedTaskId(paramTaskId);
    } else if (tasks.length > 0) {
      setSelectedTaskId(tasks[0]._id || tasks[0].id);
    }
  }, [paramTaskId, tasks]);

  useEffect(() => {
    setReviewReport(null);
  }, [selectedTaskId]);

  const handleRequestReview = async () => {
    if (!selectedTaskId) return;

    try {
      setLoadingReview(true);
      const res = await api.get(`/ai/review?taskId=${selectedTaskId}`);
      setReviewReport(res.data);
    } catch (err) {
      console.error("AI review request failed:", err.message);
    } finally {
      setLoadingReview(false);
    }
  };

  const getActiveTask = () => {
    return tasks.find(t => t._id === selectedTaskId || t.id === selectedTaskId) || null;
  };

  const getDiffText = () => {
    const task = getActiveTask();
    if (!task) return diffs.general;
    const title = task.title.toLowerCase();
    if (title.includes("websocket") || title.includes("socket")) return diffs.websocket;
    if (title.includes("jwt") || title.includes("auth")) return diffs.jwt;
    return diffs.general;
  };

  const activeTask = getActiveTask();

  return (
    <div className="p-6 md:p-8 space-y-6 font-mono select-none">
      
      {/* 1. Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold">Automated AI Pull Requests</div>
          <h1 className="text-xl font-bold text-[#f8fafc]">Code Review</h1>
        </div>

        {/* Task Dropdown Selector */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-[10px] text-[#64748b] font-bold uppercase">SELECT PR:</span>
          <select
            value={selectedTaskId}
            onChange={e => setSelectedTaskId(e.target.value)}
            className="p-2.5 rounded-lg bg-[#0f131a] border border-[#1e293b] text-xs outline-none text-[#e2e8f0] focus:border-indigo-500 font-mono"
          >
            {tasks.map(t => (
              <option key={t._id || t.id} value={t._id || t.id}>
                {t.title.substring(0, 35)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Diffs and Review Main Display Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Left Col: Git Diff block */}
        <div className="space-y-3.5">
          <h3 className="text-[10px] font-bold tracking-widest text-[#475569] uppercase border-b border-[#1e293b] pb-2">
            PROPOSED CODE REVISIONS (GIT DIFF)
          </h3>
          <div className="rounded-lg bg-[#090b11] border border-[#1e293b] overflow-hidden">
            <div className="px-4 py-2 border-b border-[#1e293b] bg-[#0c0e15] flex items-center justify-between text-[10px] text-[#64748b] font-mono">
              <span>{activeTask ? `${activeTask.category || 'general'}_revisions.diff` : 'changes.diff'}</span>
              <span className="text-indigo-400 font-bold uppercase">{activeTask?.category || 'General'}</span>
            </div>
            
            {/* Colorized pre block */}
            <pre className="p-4 overflow-x-auto text-[10px] leading-relaxed font-mono custom-scrollbar max-h-[480px] select-text">
              <code>
                {getDiffText().split('\n').map((line, i) => {
                  let lineClass = "text-[#94a3b8]";
                  if (line.startsWith("-") && !line.startsWith("---")) lineClass = "text-rose-400/90 bg-rose-950/20 px-1 rounded";
                  if (line.startsWith("+") && !line.startsWith("+++")) lineClass = "text-emerald-400/90 bg-emerald-950/20 px-1 rounded";
                  if (line.startsWith("diff") || line.startsWith("index") || line.startsWith("@@")) lineClass = "text-indigo-400/60";
                  
                  return (
                    <div key={i} className={lineClass}>
                      {line}
                    </div>
                  );
                })}
              </code>
            </pre>
          </div>

          {/* Review trigger button */}
          <button
            onClick={handleRequestReview}
            disabled={loadingReview}
            className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold text-xs transition-all shadow-lg active:scale-[0.98]"
          >
            {loadingReview ? "🔍 COMPILING CODE REVIEW..." : "🤖 REQUEST AI SECURITY CODE REVIEW"}
          </button>
        </div>

        {/* Right Col: AI Review report display */}
        <div className="space-y-3.5">
          <h3 className="text-[10px] font-bold tracking-widest text-[#475569] uppercase border-b border-[#1e293b] pb-2">
            AI AGENT FEEDBACK REPORT
          </h3>

          {loadingReview ? (
            <div className="p-20 border border-[#1e293b] bg-[#0f131a] rounded-xl flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
              <span className="text-xs uppercase text-indigo-400 font-bold tracking-wider animate-pulse">Analyzing cryptographic signatures...</span>
            </div>
          ) : reviewReport ? (
            <div className="bg-gradient-to-br from-[#10141f] to-[#0f131a] border border-indigo-500/20 rounded-xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>

              {/* Status and Score */}
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${reviewReport.status === "approved" ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                  <span className="text-[10px] font-bold text-[#f8fafc] uppercase tracking-wider font-mono">
                    Status: {reviewReport.status === "approved" ? "APPROVED" : "REVISIONS REQUESTED"}
                  </span>
                </div>
                <div className="px-3 py-1 rounded bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 font-bold text-xs font-mono shadow-sm">
                  SCORE: {reviewReport.score}
                </div>
              </div>

              {/* Report body */}
              <div className="p-4 rounded-lg bg-[#090b11]/80 border border-[#1e293b] text-xs text-[#94a3b8] leading-relaxed whitespace-pre-wrap font-mono select-text max-h-[360px] overflow-y-auto custom-scrollbar">
                {reviewReport.review}
              </div>
            </div>
          ) : (
            <div className="h-[350px] border border-dashed border-[#1e293b] rounded-xl flex items-center justify-center p-10 text-center text-xs text-[#475569] uppercase">
              Select an active pull request and request an AI Code Review to view security audits and logic checks.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

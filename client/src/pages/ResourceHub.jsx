import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../lib/axios";

export default function ResourceHub() {
  const { activeWorkspace, members, tasks } = useOutletContext();
  
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddResource, setShowAddResource] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  const [newResource, setNewResource] = useState({
    title: "",
    url: "",
    category: "documentation",
    description: "",
    annotation: "",
    associatedTask: "",
    sprint: "Sprint 3: Core Reliability",
  });

  const [aiSuggestions, setAiSuggestions] = useState([]);

  // Fetch bookmarks
  const fetchResources = async () => {
    if (!activeWorkspace) return;
    const wsId = activeWorkspace._id || activeWorkspace.id;

    try {
      setLoading(true);
      const res = await api.get(`/engineering/resources?workspaceId=${wsId}`);
      setResources(res.data);
    } catch (err) {
      console.error("Fetch resources error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [activeWorkspace]);

  // Compute smart, highly contextual AI suggestions based on active sprint blockers
  useEffect(() => {
    const suggestions = [];
    
    // Check if WebSocket is incomplete
    const isSocketIncomplete = tasks.some(t => t.title.toLowerCase().includes("websocket") && t.status !== "done");
    if (isSocketIncomplete) {
      suggestions.push({
        title: "Socket.io Sticky Sessions Configuration Guide",
        reason: "Active Blocker: WebSocket reconnect failing after refresh",
        action: "AI suggests matching Nginx sticky buffers to prevent engine.io handshake dropouts.",
        url: "https://socket.io/docs/v4/using-multiple-nodes/"
      });
    }

    // Check if Redis scaling is in todo
    const isRedisTodo = tasks.some(t => t.title.toLowerCase().includes("redis"));
    if (isRedisTodo) {
      suggestions.push({
        title: "Redis Cluster Horizontal Event Hub Map",
        reason: "Active Stack: Redis adapter scaling task is estimated at 8 points",
        action: "AI recommends validating Redis pub/sub replication limits inside Kubernetes clusters.",
        url: "https://redis.io/topics/sentinel"
      });
    }

    // Default suggestions
    suggestions.push({
      title: "PM2 Process Clustering Cluster-Mode Scaling",
      reason: "Active Context: PM2 deployed production configs",
      action: "AI recommends examining memory limits and cluster auto-restarts for Node backend.",
      url: "https://pm2.keymetrics.io/docs/usage/cluster-mode/"
    });

    setAiSuggestions(suggestions);
  }, [tasks]);

  const handleSaveToggle = async (resourceId) => {
    try {
      const res = await api.post(`/engineering/resources/${resourceId}/save`);
      setResources(prev =>
        prev.map(r => (r._id === resourceId || r.id === resourceId) ? res.data : r)
      );
    } catch (err) {
      console.error("Save bookmark failed:", err.message);
    }
  };

  const handleAddResourceSubmit = async (e) => {
    e.preventDefault();
    const wsId = activeWorkspace?._id || activeWorkspace?.id;
    if (!wsId || !newResource.title.trim() || !newResource.url.trim()) return;

    try {
      const res = await api.post("/engineering/resources", {
        ...newResource,
        workspaceId: wsId
      });
      setResources(prev => [...prev, res.data]);
      setShowAddResource(false);
      setNewResource({
        title: "",
        url: "",
        category: "documentation",
        description: "",
        annotation: "",
        associatedTask: "",
        sprint: "Sprint 3: Core Reliability",
      });
    } catch (err) {
      console.error("Add resource failed:", err.message);
      alert("Failed to save resource");
    }
  };

  const filteredResources = resources.filter(res => {
    if (activeTab === "all") return true;
    return res.category === activeTab;
  });

  const getSavedByLabel = (savedBy = []) => {
    if (savedBy.length === 0) return "Not saved yet";
    const userMap = members.reduce((acc, m) => {
      acc[m._id || m.id] = m.name.split(" ")[0];
      return acc;
    }, {});
    
    const names = savedBy.map(id => userMap[id]).filter(Boolean);
    if (names.length === 0) return `saved by ${savedBy.length} teammates`;
    if (names.length === 1) return `saved by ${names[0]}`;
    if (names.length === 2) return `saved by ${names[0]} + ${names[1]}`;
    return `saved by ${names[0]} + ${names.length - 1} teammates`;
  };

  return (
    <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono select-none">
      
      {/* LEFT GRID: Main Resource Bookmark hub (Col-Span 2) */}
      <div className="lg:col-span-2 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold">Teammate Bookmarks</div>
            <h1 className="text-xl font-bold text-[#f8fafc]">Resource Hub</h1>
          </div>

          <button
            onClick={() => setShowAddResource(true)}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white shadow-md active:scale-95 transition-all shrink-0"
          >
            + ADD BOOKMARK
          </button>
        </div>

        {/* Categories Tab selectors */}
        <div className="flex items-center gap-2 border-b border-[#1e293b]/40 pb-2">
          {[
            { id: "all", label: "ALL RESOURCES" },
            { id: "documentation", label: "DOCUMENTATION" },
            { id: "tool", label: "DEV TOOLS" },
            { id: "repository", label: "REPOSITORIES" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded text-[10px] font-bold tracking-wider transition-all uppercase ${
                activeTab === tab.id
                  ? "bg-[#161b26] border border-[#273244] text-[#f8fafc]"
                  : "text-[#64748b] hover:text-[#e2e8f0]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Resources Card Grid */}
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 rounded-full border border-indigo-500 border-t-transparent animate-spin"></div>
            <span className="text-[10px] text-[#64748b] uppercase">Loading bookmarks...</span>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="p-16 border border-dashed border-[#1e293b] rounded-xl text-center text-xs text-[#475569] uppercase">
            No bookmarks saved under this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredResources.map((res) => {
              const hasSaved = res.savedBy && res.savedBy.includes(members[0]?._id || members[0]?.id || "");
              return (
                <div
                  key={res._id || res.id}
                  className="bg-[#0f131a] border border-[#1e293b] rounded-xl p-5 hover:border-[#334155] transition-all hover:-translate-y-0.5 duration-200 flex flex-col justify-between shadow-md relative group overflow-hidden"
                >
                  <div className="space-y-3.5">
                    {/* Header line */}
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-900 border border-slate-700/60 text-slate-400 font-bold uppercase">
                        {res.category}
                      </span>
                      {res.sprint && (
                        <span className="text-[9px] text-indigo-400 font-mono">
                          🔗 {res.sprint}
                        </span>
                      )}
                    </div>

                    {/* Title & URL Link */}
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-[#f8fafc] group-hover:text-indigo-400 transition-colors tracking-tight uppercase leading-snug">
                        {res.title}
                      </h3>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] text-[#475569] hover:text-[#94a3b8] transition-colors truncate block max-w-full font-mono"
                      >
                        {res.url}
                      </a>
                    </div>

                    <p className="text-[10px] text-[#94a3b8] leading-relaxed">
                      {res.description || "No general description provided."}
                    </p>

                    {/* Collaborative Annotation Section */}
                    {res.annotation && (
                      <div className="p-3 bg-[#090b11]/80 rounded-lg border border-[#1e293b]/70 space-y-1 font-mono">
                        <span className="block text-[8px] font-bold text-[#475569] uppercase tracking-widest">
                          COLLABORATIVE COMMENTARY
                        </span>
                        <p className="text-[10px] text-[#b4babe] italic leading-normal">
                          "{res.annotation}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footing detail & save action */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#1e293b]/60 mt-4 text-[9px] font-mono text-[#64748b]">
                    <span>
                      {getSavedByLabel(res.savedBy)}
                    </span>

                    <button
                      onClick={() => handleSaveToggle(res._id || res.id)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                        hasSaved
                          ? "bg-indigo-950/40 text-indigo-400 border border-indigo-500/20"
                          : "bg-slate-900 text-[#94a3b8] border border-slate-700/60 hover:text-indigo-400 hover:border-indigo-500/30"
                      }`}
                    >
                      <span>★</span>
                      <span>{hasSaved ? "SAVED" : "SAVE"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR: AI Knowledge Pulse Sidebar */}
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold tracking-widest text-[#475569] uppercase border-b border-[#1e293b] pb-2">
            AI Knowledge Pulse
          </h2>
          <div className="bg-gradient-to-br from-[#10141f] to-[#0f131a] border border-indigo-500/20 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">ACTIVE INTELLIGENCE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.8)] animate-pulse"></span>
            </div>

            <p className="text-[10px] text-[#94a3b8] leading-relaxed font-mono">
              AI Knowledge Pulse scans your active sprint tasks, blocks, and stack allocations to dynamically recommend contextually-critical libraries, guides, and security protocols.
            </p>

            {/* Suggestions list */}
            <div className="space-y-3 pt-2">
              {aiSuggestions.map((sug, i) => (
                <div key={i} className="p-3 rounded-lg border border-[#1e293b] bg-[#0c0e15] space-y-2">
                  <div className="space-y-0.5">
                    <span className="block text-[8px] font-bold text-indigo-400 uppercase tracking-wider font-mono">
                      {sug.reason}
                    </span>
                    <h4 className="text-[10px] font-bold text-[#f8fafc] leading-tight font-mono uppercase tracking-tight">
                      {sug.title}
                    </h4>
                  </div>
                  <p className="text-[9px] text-[#64748b] leading-normal font-mono">
                    {sug.action}
                  </p>
                  <a
                    href={sug.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-[9px] text-indigo-400 hover:text-indigo-300 font-bold uppercase font-mono"
                  >
                    READ REFERENCE ↗
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. ADD BOOKMARK MODAL OVERLAY */}
      {showAddResource && (
        <div className="fixed inset-0 z-50 bg-[#090b11]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0f131a] border border-[#1e293b] rounded-xl shadow-2xl overflow-hidden p-6 space-y-4 animate-fade-in font-mono">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <h3 className="text-sm font-bold text-[#f8fafc] uppercase tracking-wide">
                Save Engineering Bookmark
              </h3>
              <button
                onClick={() => setShowAddResource(false)}
                className="text-[#64748b] hover:text-[#f8fafc] font-bold text-xs"
              >
                ✕ CLOSE
              </button>
            </div>

            <form onSubmit={handleAddResourceSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#64748b] uppercase">Bookmark Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Socket.io Client Resilience Guide"
                  value={newResource.title}
                  onChange={e => setNewResource({ ...newResource, title: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0] focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#64748b] uppercase">Reference URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/docs"
                  value={newResource.url}
                  onChange={e => setNewResource({ ...newResource, url: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0] focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase">Category</label>
                  <select
                    value={newResource.category}
                    onChange={e => setNewResource({ ...newResource, category: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0]"
                  >
                    <option value="documentation">Documentation 📝</option>
                    <option value="tool">Dev Tool 🛠️</option>
                    <option value="repository">Repository 💻</option>
                    <option value="article">Article 📄</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase">Linked Task</label>
                  <select
                    value={newResource.associatedTask}
                    onChange={e => setNewResource({ ...newResource, associatedTask: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0]"
                  >
                    <option value="">None</option>
                    {tasks.map(t => (
                      <option key={t._id || t.id} value={t.title}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#64748b] uppercase">Dev Annotation ("why this matters")</label>
                <textarea
                  rows="2"
                  placeholder="Explain why this resource is vital for the team..."
                  value={newResource.annotation}
                  onChange={e => setNewResource({ ...newResource, annotation: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0] focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#64748b] uppercase">General Description</label>
                <textarea
                  rows="2"
                  placeholder="Briefly describe what this resource covers..."
                  value={newResource.description}
                  onChange={e => setNewResource({ ...newResource, description: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0] focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setShowAddResource(false)}
                  className="px-4 py-2 rounded-lg border border-[#1e293b] text-xs text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#171e29]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white"
                >
                  SAVE RESOURCE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

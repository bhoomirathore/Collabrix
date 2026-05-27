import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../lib/axios";

export default function EngineersSpace() {
  const {
    activeWorkspace,
    members,
    events,
    setEvents,
    tasks
  } = useOutletContext();

  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAi, setLoadingAi] = useState(true);
  const [inspectedItem, setInspectedItem] = useState(null);

  // Fetch AI Sprint Plan and Momentum Details
  useEffect(() => {
    if (!activeWorkspace) return;
    const wsId = activeWorkspace._id || activeWorkspace.id;

    const fetchAiSprintDetails = async () => {
      try {
        setLoadingAi(true);
        const res = await api.get(`/ai/sprint?workspaceId=${wsId}`);
        setAiSummary(res.data);
      } catch (err) {
        console.error("Fetch AI sprint info failed:", err.message);
      } finally {
        setLoadingAi(false);
      }
    };

    fetchAiSprintDetails();
  }, [activeWorkspace, events]); // Refresh when events change to update momentum

  const eventColors = {
    task_moved: "border-l-4 border-l-amber-500 bg-amber-500/5",
    commit_pushed: "border-l-4 border-l-sky-500 bg-sky-500/5",
    wiki_updated: "border-l-4 border-l-purple-500 bg-purple-500/5",
    snippet_created: "border-l-4 border-l-yellow-500 bg-yellow-500/5",
    resource_saved: "border-l-4 border-l-emerald-500 bg-emerald-500/5",
    ai_review_generated: "border-l-4 border-l-indigo-500 bg-indigo-500/5",
    chat_highlight: "border-l-4 border-l-rose-500 bg-rose-500/5",
  };

  const eventBadges = {
    task_moved: "🛠️",
    commit_pushed: "💻",
    wiki_updated: "📝",
    snippet_created: "🏷️",
    resource_saved: "🔖",
    ai_review_generated: "🤖",
    chat_highlight: "🔥",
  };

  // Humanize event timestamp strings
  const getEventTime = (isoString) => {
    if (!isoString) return "Just now";
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Deep Link Inspector Handler
  const handleInspectLink = async (targetType, targetId, title) => {
    if (!targetType || !targetId) return;

    try {
      if (targetType === "task") {
        const res = await api.get(`/tasks`);
        const match = res.data.find(t => t._id === targetId || t.id === targetId);
        if (match) setInspectedItem({ type: "Task", title: match.title, desc: match.description, meta: `Points: ${match.storyPoints} | Status: ${match.status.replace('_', ' ').toUpperCase()}` });
      } else if (targetType === "wiki") {
        const res = await api.get(`/engineering/wikis?workspaceId=${activeWorkspace._id || activeWorkspace.id}`);
        const match = res.data.find(w => w._id === targetId || w.id === targetId);
        if (match) setInspectedItem({ type: "Wiki", title: match.title, desc: match.content, meta: `Author ID: ${match.author}` });
      } else if (targetType === "snippet") {
        const res = await api.get(`/engineering/snippets?workspaceId=${activeWorkspace._id || activeWorkspace.id}`);
        const match = res.data.find(s => s._id === targetId || s.id === targetId);
        if (match) setInspectedItem({ type: "Snippet Code", title: match.title, desc: match.code, meta: `Language: ${match.language} | ${match.description}` });
      } else if (targetType === "resource") {
        const res = await api.get(`/engineering/resources?workspaceId=${activeWorkspace._id || activeWorkspace.id}`);
        const match = res.data.find(r => r._id === targetId || r.id === targetId);
        if (match) setInspectedItem({ type: "Resource Bookmark", title: match.title, desc: match.description || "No description provided.", meta: `URL: ${match.url} | Annotation: ${match.annotation}` });
      } else if (targetType === "review") {
        const res = await api.get(`/ai/review?taskId=${tasks[0]?._id || tasks[0]?.id || ""}`);
        setInspectedItem({ type: "AI Security Code Review", title: title || "Security Review", desc: res.data.review, meta: `Security Grade: ${res.data.score || "A+"}` });
      }
    } catch (err) {
      console.error("Inspect link error:", err.message);
    }
  };

  return (
    <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono select-none">
      
      {/* LEFT & CENTER PANEL: Timeline Stream (Col-Span 2) */}
      <div className="lg:col-span-2 space-y-5">
        <div className="space-y-1 pb-4 border-b border-[#1e293b]">
          <div className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold">Active Operational Feed</div>
          <h1 className="text-xl font-bold text-[#f8fafc]">Engineer's Space</h1>
        </div>

        {/* Live Stream feed */}
        <div className="relative pl-6 space-y-5">
          {/* Vertical timeline connector */}
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-800"></div>

          {events.length === 0 ? (
            <div className="p-10 border border-dashed border-[#1e293b] rounded-xl text-center text-xs text-[#475569] uppercase font-mono">
              No recent timeline activities.
            </div>
          ) : (
            events.map((event) => {
              const eventUser = event.user && typeof event.user === "object" ? event.user : members.find(m => (m._id === event.user || m.id === event.user));
              return (
                <div
                  key={event._id || event.id}
                  className={`relative p-4 rounded-xl border border-[#1e293b]/70 flex flex-col sm:flex-row items-start gap-4 transition-all duration-200 hover:border-[#334155] ${
                    eventColors[event.type] || "bg-[#0f131a] border border-[#1e293b]"
                  }`}
                >
                  {/* Timeline Badge Dot */}
                  <span className="absolute -left-[20px] top-[18px] z-10 flex h-4 w-4 items-center justify-center rounded-full bg-[#0c0e15] border border-slate-700 text-[8px] shadow-sm">
                    {eventBadges[event.type] || "🔹"}
                  </span>

                  {/* Teammate avatar */}
                  <div className="shrink-0 relative">
                    <img
                      src={eventUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                      alt={eventUser?.name || "Developer"}
                      className="w-9 h-9 rounded-full object-cover border border-[#1e293b] shadow-inner"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[#0c0e15] bg-emerald-500"></span>
                  </div>

                  {/* Event Text detail */}
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-[#f8fafc] truncate font-mono">
                        {eventUser?.name || "Engineer"}
                      </span>
                      <span className="text-[9px] text-[#64748b] font-mono shrink-0">
                        {getEventTime(event.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-xs text-[#94a3b8] leading-relaxed tracking-tight">
                      {event.message}
                    </p>

                    {/* Deep Linking action link if reference present */}
                    {event.targetType && event.targetId && (
                      <button
                        onClick={() => handleInspectLink(event.targetType, event.targetId, event.message)}
                        className="mt-2 flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase transition-all font-mono"
                      >
                        <span>👀</span> Inspect Linked {event.targetType}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Engineering Intelligence Panel */}
      <div className="space-y-6">
        {/* Workspace Momentum report (AI powered) */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold tracking-widest text-[#475569] uppercase border-b border-[#1e293b] pb-2">
            AI Sprint Momentum
          </h2>
          {loadingAi ? (
            <div className="p-5 bg-[#0f131a] border border-[#1e293b] rounded-xl flex items-center justify-center gap-3">
              <div className="w-4 h-4 rounded-full border border-indigo-500 border-t-transparent animate-spin"></div>
              <span className="text-[10px] text-[#64748b] uppercase">AI evaluating stack...</span>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-[#10141f] to-[#0f131a] border border-indigo-500/20 rounded-xl p-5 shadow-2xl relative overflow-hidden space-y-4">
              <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
              
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                <span className="text-[10px] font-bold text-indigo-400 uppercase font-mono tracking-wider">AI AGENT ASSISTANT</span>
                <span className="text-[9px] text-[#64748b] font-mono uppercase">ONLINE 🤖</span>
              </div>

              {/* Progress gauge */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] text-[#94a3b8] font-mono">
                  <span>Sprint Completion Weight:</span>
                  <span className="text-[#f8fafc] font-bold">{aiSummary?.metrics?.sprintProgress || 0}%</span>
                </div>
                <div className="w-full bg-[#090b11] h-2 rounded-full overflow-hidden border border-[#1e293b]">
                  <div className="bg-indigo-500 h-full rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)] transition-all duration-300" style={{ width: `${aiSummary?.metrics?.sprintProgress || 0}%` }}></div>
                </div>
              </div>

              <div className="p-3 bg-[#090b11]/80 rounded-lg text-[10px] text-[#94a3b8] leading-relaxed border border-[#1e293b]/70 font-mono">
                {aiSummary?.summary}
              </div>

              {/* AI Sprint Recommendations */}
              {aiSummary?.recommendations && aiSummary.recommendations.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-[#475569] uppercase font-mono">Sprint Momentum Recommendations:</span>
                  {aiSummary.recommendations.map((rec, i) => (
                    <div key={i} className="p-3 rounded-lg border border-amber-500/10 bg-amber-500/[0.02] space-y-1">
                      <span className="text-[10px] font-bold text-amber-400 leading-none font-mono">⚠️ {rec.title}</span>
                      <p className="text-[9px] text-[#94a3b8] leading-normal font-mono">{rec.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Active stack gauges */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold tracking-widest text-[#475569] uppercase border-b border-[#1e293b] pb-2">
            Active Stack Allocation
          </h2>
          <div className="bg-[#0f131a] border border-[#1e293b] rounded-xl p-4 space-y-3.5">
            {[
              { label: "Backend Core", points: tasks.filter(t => t.category === "backend").reduce((sum, t) => sum + (t.storyPoints || 0), 0), color: "bg-indigo-500" },
              { label: "Frontend UI", points: tasks.filter(t => t.category === "frontend").reduce((sum, t) => sum + (t.storyPoints || 0), 0), color: "bg-emerald-500" },
              { label: "DevOps & Infrastructure", points: tasks.filter(t => t.category === "devops").reduce((sum, t) => sum + (t.storyPoints || 0), 0), color: "bg-sky-500" },
              { label: "Docs & Playbooks", points: tasks.filter(t => t.category === "docs").reduce((sum, t) => sum + (t.storyPoints || 0), 0), color: "bg-purple-500" },
            ].map((stack, i) => {
              const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0) || 1;
              const percent = Math.round((stack.points / totalPoints) * 100);
              return (
                <div key={i} className="space-y-1.5 font-mono">
                  <div className="flex items-center justify-between text-[10px] text-[#94a3b8]">
                    <span>{stack.label}</span>
                    <span className="text-[#f8fafc] font-bold">{stack.points} SP ({percent}%)</span>
                  </div>
                  <div className="w-full bg-[#0c0e15] h-1.5 rounded-full overflow-hidden border border-[#1e293b]">
                    <div className={`${stack.color} h-full rounded-full transition-all duration-300`} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spike events & Collaboration stats */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold tracking-widest text-[#475569] uppercase border-b border-[#1e293b] pb-2">
            Collaboration spikes
          </h2>
          <div className="p-3 bg-[#0f131a] border border-[#1e293b] rounded-xl space-y-2 text-[10px] text-[#64748b]">
            <div className="flex items-center justify-between">
              <span>"most discussed task"</span>
              <span className="text-amber-400 font-bold">WebSocket Reconnect</span>
            </div>
            <div className="flex items-center justify-between">
              <span>"backend activity shift"</span>
              <span className="text-emerald-400 font-bold">Increased +24% today</span>
            </div>
            <div className="flex items-center justify-between">
              <span>"AI review alignment"</span>
              <span className="text-indigo-400 font-bold">100% active sprint tracking</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. DEEP LINK INSPECTION OVERLAY MODAL */}
      {inspectedItem && (
        <div className="fixed inset-0 z-50 bg-[#090b11]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0f131a] border border-[#1e293b] rounded-xl shadow-2xl overflow-hidden p-6 space-y-4 animate-fade-in font-mono">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                INSPECTOR — {inspectedItem.type}
              </span>
              <button
                onClick={() => setInspectedItem(null)}
                className="text-[#64748b] hover:text-[#f8fafc] text-xs font-bold transition-colors"
              >
                ✕ CLOSE
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#f8fafc] uppercase tracking-wide">
                {inspectedItem.title}
              </h3>
              
              <div className="text-[10px] text-indigo-300 bg-[#0c0e15] px-2 py-1 rounded border border-[#1e293b] inline-block">
                {inspectedItem.meta}
              </div>

              <div className="p-4 bg-[#171e29] border border-[#1e293b] rounded-lg text-xs text-[#94a3b8] leading-relaxed overflow-x-auto max-h-[350px] whitespace-pre-wrap font-mono custom-scrollbar">
                {inspectedItem.desc}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#1e293b]">
              <button
                onClick={() => setInspectedItem(null)}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white"
              >
                ACKNOWLEDGE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

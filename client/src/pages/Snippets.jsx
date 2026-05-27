import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../lib/axios";

export default function Snippets() {
  const { activeWorkspace, members } = useOutletContext();

  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSnippet, setShowAddSnippet] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const [newSnippet, setNewSnippet] = useState({
    title: "",
    code: "",
    language: "javascript",
    description: "",
  });

  const fetchSnippets = async () => {
    if (!activeWorkspace) return;
    const wsId = activeWorkspace._id || activeWorkspace.id;

    try {
      setLoading(true);
      const res = await api.get(`/engineering/snippets?workspaceId=${wsId}`);
      setSnippets(res.data);
    } catch (err) {
      console.error("Fetch snippets error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnippets();
  }, [activeWorkspace]);

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleAddSnippetSubmit = async (e) => {
    e.preventDefault();
    const wsId = activeWorkspace?._id || activeWorkspace?.id;
    if (!wsId || !newSnippet.title.trim() || !newSnippet.code.trim()) return;

    try {
      const res = await api.post("/engineering/snippets", {
        ...newSnippet,
        workspaceId: wsId
      });
      setSnippets(prev => [...prev, res.data]);
      setShowAddSnippet(false);
      setNewSnippet({
        title: "",
        code: "",
        language: "javascript",
        description: "",
      });
    } catch (err) {
      console.error("Create snippet failed:", err.message);
      alert("Failed to share snippet");
    }
  };

  const getAuthorName = (authorId) => {
    const author = members.find(m => (m._id === authorId || m.id === authorId));
    return author ? author.name.split(" ")[0] : "System Dev";
  };

  return (
    <div className="p-6 md:p-8 space-y-6 font-mono select-none">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold">Shared Code Blocks</div>
          <h1 className="text-xl font-bold text-[#f8fafc]">Snippets</h1>
        </div>

        <button
          onClick={() => setShowAddSnippet(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white shadow-md active:scale-95 transition-all shrink-0"
        >
          + SHARE SNIPPET
        </button>
      </div>

      {/* Grid of Shared Code snippets */}
      {loading ? (
        <div className="p-20 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 rounded-full border border-indigo-500 border-t-transparent animate-spin"></div>
          <span className="text-[10px] text-[#64748b] uppercase">Loading snippets...</span>
        </div>
      ) : snippets.length === 0 ? (
        <div className="p-16 border border-dashed border-[#1e293b] rounded-xl text-center text-xs text-[#475569] uppercase">
          No snippets shared in this workspace yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {snippets.map((snip) => (
            <div
              key={snip._id || snip.id}
              className="bg-[#0f131a] border border-[#1e293b] rounded-xl p-5 hover:border-[#334155] transition-colors shadow-md relative group overflow-hidden"
            >
              {/* Top row description */}
              <div className="flex items-center justify-between gap-4 border-b border-[#1e293b]/60 pb-3 mb-4">
                <div className="space-y-1 min-w-0">
                  <h3 className="text-xs font-bold text-[#f8fafc] truncate tracking-wide uppercase leading-none">
                    {snip.title}
                  </h3>
                  <p className="text-[9px] text-[#64748b] leading-tight truncate">
                    {snip.description || "No description provided."}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-900 border border-slate-700/60 text-indigo-400 font-bold uppercase">
                    {snip.language}
                  </span>
                  <span className="text-[10px] text-[#475569] font-mono">
                    by {getAuthorName(snip.author)}
                  </span>
                </div>
              </div>

              {/* Code viewer with copy utilities */}
              <div className="relative rounded-lg bg-[#090b11] border border-[#1e293b]/70 overflow-hidden group/viewer">
                {/* Copy button */}
                <button
                  onClick={() => handleCopy(snip.code, snip._id || snip.id)}
                  className={`absolute right-3 top-3 z-10 px-2.5 py-1 rounded text-[9px] font-bold tracking-wider transition-all shadow-md ${
                    copiedId === (snip._id || snip.id)
                      ? "bg-emerald-600 text-white"
                      : "bg-[#171e29] border border-[#1e293b] text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1f2838]"
                  }`}
                >
                  {copiedId === (snip._id || snip.id) ? "COPIED" : "COPY CODE"}
                </button>

                {/* Styled Code Block */}
                <pre className="p-4 overflow-x-auto text-[10px] text-indigo-200/90 leading-relaxed font-mono custom-scrollbar select-text">
                  <code>{snip.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD SNIPPET MODAL OVERLAY */}
      {showAddSnippet && (
        <div className="fixed inset-0 z-50 bg-[#090b11]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0f131a] border border-[#1e293b] rounded-xl shadow-2xl overflow-hidden p-6 space-y-4 animate-fade-in font-mono">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <h3 className="text-sm font-bold text-[#f8fafc] uppercase tracking-wide">
                Share New Code Block
              </h3>
              <button
                onClick={() => setShowAddSnippet(false)}
                className="text-[#64748b] hover:text-[#f8fafc] font-bold text-xs"
              >
                ✕ CLOSE
              </button>
            </div>

            <form onSubmit={handleAddSnippetSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase">Snippet Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JWT blacklist middleware"
                    value={newSnippet.title}
                    onChange={e => setNewSnippet({ ...newSnippet, title: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0] focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase">Language</label>
                  <select
                    value={newSnippet.language}
                    onChange={e => setNewSnippet({ ...newSnippet, language: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0]"
                  >
                    <option value="javascript">JavaScript ⚙️</option>
                    <option value="typescript">TypeScript 🟦</option>
                    <option value="python">Python 🐍</option>
                    <option value="rust">Rust 🦀</option>
                    <option value="css">CSS 🎨</option>
                    <option value="sql">SQL 💾</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#64748b] uppercase">Short Description</label>
                <input
                  type="text"
                  placeholder="e.g. Express controller routing middleware blacklisting JWT tokens on logout"
                  value={newSnippet.description}
                  onChange={e => setNewSnippet({ ...newSnippet, description: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0] focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1 flex-1 flex flex-col">
                <label className="block text-[10px] font-bold text-[#64748b] uppercase">Raw Source Code</label>
                <textarea
                  required
                  rows="10"
                  placeholder="Paste your source code block here..."
                  value={newSnippet.code}
                  onChange={e => setNewSnippet({ ...newSnippet, code: e.target.value })}
                  className="w-full p-3 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-indigo-300 font-mono resize-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setShowAddSnippet(false)}
                  className="px-4 py-2 rounded-lg border border-[#1e293b] text-xs text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#171e29]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white"
                >
                  SHARE CODE BLOCK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

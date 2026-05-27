import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../lib/axios";

export default function Wiki() {
  const { activeWorkspace, members, setEvents, socket } = useOutletContext();
  
  const [wikis, setWikis] = useState([]);
  const [activeWiki, setActiveWiki] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddWiki, setShowAddWiki] = useState(false);

  const [editorData, setEditorData] = useState({
    title: "",
    content: "",
  });

  const [newWikiData, setNewWikiData] = useState({
    title: "",
    content: "",
  });

  // Fetch wikis
  const fetchWikis = async () => {
    if (!activeWorkspace) return;
    const wsId = activeWorkspace._id || activeWorkspace.id;

    try {
      setLoading(true);
      const res = await api.get(`/engineering/wikis?workspaceId=${wsId}`);
      setWikis(res.data);
      if (res.data.length > 0) {
        setActiveWiki(res.data[0]);
      } else {
        setActiveWiki(null);
      }
    } catch (err) {
      console.error("Fetch wikis error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWikis();
  }, [activeWorkspace]);

  // Handle edit mode save
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!activeWiki || !editorData.title.trim() || !editorData.content.trim()) return;

    const wId = activeWiki._id || activeWiki.id;
    try {
      const res = await api.patch(`/engineering/wikis/${wId}`, editorData);
      setWikis(prev => prev.map(w => (w._id === wId || w.id === wId) ? res.data : w));
      setActiveWiki(res.data);
      setIsEditing(false);
    } catch (err) {
      console.error("Update wiki failed:", err.message);
      alert("Failed to update wiki page");
    }
  };

  // Handle new wiki save
  const handleCreateWiki = async (e) => {
    e.preventDefault();
    const wsId = activeWorkspace?._id || activeWorkspace?.id;
    if (!wsId || !newWikiData.title.trim() || !newWikiData.content.trim()) return;

    try {
      const res = await api.post("/engineering/wikis", {
        ...newWikiData,
        workspaceId: wsId
      });
      
      setWikis(prev => [...prev, res.data]);
      setActiveWiki(res.data);
      setShowAddWiki(false);
      setNewWikiData({ title: "", content: "" });
    } catch (err) {
      console.error("Create wiki error:", err.message);
      alert("Failed to create wiki");
    }
  };

  const startEdit = () => {
    if (!activeWiki) return;
    setEditorData({
      title: activeWiki.title,
      content: activeWiki.content,
    });
    setIsEditing(true);
  };

  const getAuthorName = (authorId) => {
    const author = members.find(m => (m._id === authorId || m.id === authorId));
    return author ? author.name : "System Dev";
  };

  return (
    <div className="p-6 md:p-8 h-full flex flex-col md:flex-row gap-6 font-mono select-none">
      
      {/* 1. LEFT DIRECTORY PANEL: Wikis directory lists */}
      <div className="w-full md:w-64 border border-[#1e293b] bg-[#0c0e15] rounded-xl flex flex-col shrink-0 overflow-hidden">
        <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none">
            WIKI DOCUMENTATION
          </span>
          <button
            onClick={() => {
              setShowAddWiki(true);
              setIsEditing(false);
            }}
            className="text-[10px] bg-[#161b26] border border-[#273244] text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1a2130] px-2 py-1 rounded"
          >
            + NEW
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
          {loading ? (
            <div className="p-10 text-[9px] text-[#64748b] text-center uppercase">Loading list...</div>
          ) : wikis.length === 0 ? (
            <div className="p-10 text-[9px] text-[#475569] text-center uppercase">No docs found.</div>
          ) : (
            wikis.map(wiki => {
              const isActive = activeWiki && (wiki._id === activeWiki._id || wiki.id === activeWiki.id);
              return (
                <button
                  key={wiki._id || wiki.id}
                  onClick={() => {
                    setActiveWiki(wiki);
                    setIsEditing(false);
                    setShowAddWiki(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-left rounded-md transition-colors ${
                    isActive
                      ? "bg-[#161b26] text-indigo-400 font-semibold"
                      : "text-[#94a3b8] hover:bg-[#111622] hover:text-[#f8fafc]"
                  }`}
                >
                  <span>📝</span>
                  <span className="truncate">{wiki.title}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. MAIN WORKSPACE PANEL: Display or Editor (Col-Span-2 equivalent) */}
      <div className="flex-1 border border-[#1e293b] bg-[#0f131a] rounded-xl flex flex-col overflow-hidden min-h-[500px]">
        {showAddWiki ? (
          /* CREATE WIKI FORM */
          <form onSubmit={handleCreateWiki} className="p-6 flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <span className="text-xs font-bold text-[#f8fafc] uppercase font-mono">Create Engineering Wiki Page</span>
              <button
                type="button"
                onClick={() => setShowAddWiki(false)}
                className="text-xs text-[#64748b] hover:text-[#f8fafc]"
              >
                CANCEL
              </button>
            </div>
            
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-[#64748b] uppercase">Article Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Docker Compose Setup & PM2 Scaling Specs"
                value={newWikiData.title}
                onChange={e => setNewWikiData({ ...newWikiData, title: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0]"
              />
            </div>

            <div className="flex-1 flex flex-col space-y-1">
              <label className="block text-[9px] font-bold text-[#64748b] uppercase">Markdown Content</label>
              <textarea
                required
                rows="15"
                placeholder="# Document title&#10;&#10;Detailed operational guidelines here..."
                value={newWikiData.content}
                onChange={e => setNewWikiData({ ...newWikiData, content: e.target.value })}
                className="w-full flex-1 p-3 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0] font-mono resize-none"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-[#1e293b]">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white shadow-lg active:scale-95 transition-all"
              >
                PUBLISH WIKI PAGE
              </button>
            </div>
          </form>
        ) : isEditing ? (
          /* EDIT WIKI FORM */
          <form onSubmit={handleSaveEdit} className="p-6 flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <span className="text-xs font-bold text-[#f8fafc] uppercase font-mono">Editing: {activeWiki?.title}</span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-[#64748b] hover:text-[#f8fafc]"
              >
                CANCEL
              </button>
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-[#64748b] uppercase">Article Title</label>
              <input
                type="text"
                required
                value={editorData.title}
                onChange={e => setEditorData({ ...editorData, title: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0]"
              />
            </div>

            <div className="flex-1 flex flex-col space-y-1">
              <label className="block text-[9px] font-bold text-[#64748b] uppercase">Markdown Content</label>
              <textarea
                required
                rows="15"
                value={editorData.content}
                onChange={e => setEditorData({ ...editorData, content: e.target.value })}
                className="w-full flex-1 p-3 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0] font-mono resize-none"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-[#1e293b]">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white shadow-lg active:scale-95 transition-all"
              >
                SAVE DOCUMENT
              </button>
            </div>
          </form>
        ) : activeWiki ? (
          /* READ MODE SCREEN */
          <div className="p-6 flex-1 flex flex-col justify-between overflow-hidden">
            <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-2 select-text">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] pb-3">
                <h2 className="text-sm font-bold text-[#f8fafc] uppercase tracking-wide">
                  {activeWiki.title}
                </h2>
                <button
                  onClick={startEdit}
                  className="px-3 py-1.5 rounded bg-[#161b26] border border-[#273244] text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase transition-all shrink-0"
                >
                  ✏️ EDIT DOCUMENT
                </button>
              </div>

              {/* Document metadata block */}
              <div className="flex items-center gap-2 text-[10px] text-[#64748b] font-mono">
                <span>Written by:</span>
                <span className="text-indigo-400 font-bold">{getAuthorName(activeWiki.author)}</span>
                <span>•</span>
                <span>Last Updated:</span>
                <span className="text-[#94a3b8]">{new Date(activeWiki.updatedAt).toLocaleDateString()}</span>
              </div>

              {/* Renders markdown body inside pre block with nice styling */}
              <div className="p-5 rounded-lg bg-[#090b11]/80 border border-[#1e293b]/70 font-mono text-xs text-[#94a3b8] leading-relaxed whitespace-pre-wrap">
                {activeWiki.content}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-10 text-center text-xs text-[#475569] uppercase">
            Create or select a technical wiki article to start.
          </div>
        )}
      </div>
    </div>
  );
}

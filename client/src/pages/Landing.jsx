import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#090b11] text-[#e2e8f0] flex flex-col items-center justify-center p-6 relative font-mono select-none overflow-hidden">
      {/* Visual background details */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-purple-600/5 rounded-full blur-[90px] pointer-events-none"></div>

      <div className="max-w-3xl w-full text-center space-y-8 relative z-10">
        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-[#0f131a] text-xs font-bold text-indigo-400 uppercase tracking-widest shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
          Collabrix v1.0 Released
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-[#f8fafc] leading-tight">
            A Living Collaborative <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-500 glow-text">
              Engineering Operating System
            </span>
          </h1>
          <p className="max-w-xl mx-auto text-xs md:text-sm text-[#94a3b8] leading-relaxed">
            Consolidate your Kanban sprint boards, Slack-dense chats, annotated technical bookmarks, shared code snippets, markdown wikis, and automated AI code review engines into a unified real-time grid.
          </p>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto text-left pt-4">
          {[
            { tag: "01", label: "Multiplayer Kanban" },
            { tag: "02", label: "Engineer's Space Timeline" },
            { tag: "03", label: "Slack-Dense Live Chat" },
            { tag: "04", label: "AI Code Reviews" }
          ].map((feat, i) => (
            <div key={i} className="p-3 bg-[#0f131a]/60 border border-[#1e293b] rounded-lg">
              <span className="block text-[10px] font-bold text-indigo-500 mb-1">{feat.tag}</span>
              <span className="block text-[10px] font-bold text-[#f8fafc] tracking-tight">{feat.label}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-95 transition-all text-center"
          >
            Enter Active Workspace
          </Link>
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-lg border border-[#1e293b] hover:border-[#334155] bg-[#0c0e15] hover:bg-[#111622] text-[#94a3b8] hover:text-[#f8fafc] text-xs font-bold uppercase tracking-wider transition-all text-center"
          >
            Create Developer Space
          </Link>
        </div>
      </div>
    </div>
  );
}
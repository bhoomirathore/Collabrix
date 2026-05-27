import { useState, useEffect, useRef } from "react";
import api from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";

export default function ChatPanel({
  isOpen,
  onClose,
  messages,
  typingUsers,
  socket,
  onMessageSent,
  onMessageReaction,
  members,
  activeWorkspace
}) {
  const { user } = useAuth();
  
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Handle input changes & typing indicators
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    
    if (!socket || !activeWorkspace) return;
    
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { isTyping: true });
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing", { isTyping: false });
    }, 1500);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const wsId = activeWorkspace?._id || activeWorkspace?.id;
    if (!wsId || !inputText.trim()) return;

    // Reset typing states
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    socket.emit("typing", { isTyping: false });

    const messageData = {
      text: inputText,
      workspaceId: wsId,
      attachments: selectedAttachment ? [selectedAttachment] : []
    };

    try {
      const res = await api.post("/chat", messageData);
      onMessageSent(res.data);
      setInputText("");
      setSelectedAttachment(null);
    } catch (err) {
      console.error("Send message error:", err.message);
    }
  };

  const handleReact = async (messageId, emoji) => {
    try {
      const res = await api.post(`/chat/${messageId}/react`, { emoji });
      onMessageReaction(res.data);
    } catch (err) {
      console.error("React error:", err.message);
    }
  };

  // Group messages sent by same user within 2 minutes
  const groupMessages = () => {
    const groups = [];
    let currentGroup = null;

    messages.forEach((msg, idx) => {
      const sender = msg.sender && typeof msg.sender === "object" ? msg.sender : { name: "System Log", _id: "system" };
      const senderId = sender._id || sender.id;
      const msgTime = new Date(msg.createdAt).getTime();

      const isConsecutive = 
        currentGroup && 
        currentGroup.senderId === senderId && 
        msgTime - currentGroup.lastTime < 120000; // 2 minutes window

      if (isConsecutive) {
        currentGroup.messages.push(msg);
        currentGroup.lastTime = msgTime;
      } else {
        currentGroup = {
          senderId,
          senderName: sender.name,
          senderAvatar: sender.avatar,
          messages: [msg],
          lastTime: msgTime,
          timeString: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        groups.push(currentGroup);
      }
    });

    return groups;
  };

  // Render attachment previews
  const renderAttachment = (att) => {
    if (!att) return null;
    
    const icons = {
      snippet: "🏷️",
      wiki: "📝",
      task: "🛠️",
      resource: "🔖",
    };

    return (
      <div className="mt-2 p-2 rounded-lg bg-[#090b11] border border-[#1e293b] flex items-center justify-between gap-3 max-w-[280px]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">{icons[att.type] || "🔗"}</span>
          <div className="min-w-0">
            <span className="block text-[8px] font-bold text-indigo-400 uppercase tracking-widest leading-none mb-1 font-mono">
              {att.type}
            </span>
            <span className="block text-xs font-semibold text-[#f8fafc] truncate font-mono">
              {att.name}
            </span>
          </div>
        </div>
        <span className="text-[10px] text-[#475569] font-mono shrink-0">Attached</span>
      </div>
    );
  };

  const messageGroups = groupMessages();

  return (
    <aside
      className={`fixed top-0 right-0 z-40 w-[340px] md:w-[380px] h-full bg-[#0c0e15] border-l border-[#1e293b] flex flex-col justify-between transition-transform duration-300 shadow-2xl ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* 1. Header */}
      <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#090b11]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse"></div>
          <span className="text-xs font-bold text-[#f8fafc] font-mono tracking-wider">LIVE WORKSPACE CHAT</span>
        </div>
        <button
          onClick={onClose}
          className="text-[#64748b] hover:text-[#f8fafc] font-bold text-xs font-mono transition-colors"
        >
          ✕ HIDE
        </button>
      </div>

      {/* 2. Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#090b11]/25">
        {messageGroups.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-xs text-[#475569] uppercase font-mono p-10 border border-dashed border-[#1e293b]/40 rounded-xl">
            Workspace Chat stream is empty. Start typing to sync with Aryan, Bhoomi, and Sarah!
          </div>
        ) : (
          messageGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="flex gap-3 group/msg-group">
              {/* Sender Avatar Column */}
              <div className="shrink-0 select-none mt-1">
                {group.senderAvatar ? (
                  <img
                    src={group.senderAvatar}
                    alt={group.senderName}
                    className="w-8 h-8 rounded-full object-cover border border-[#1e293b]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600/35 border border-[#1e293b] flex items-center justify-center font-bold text-[10px] text-white">
                    SYS
                  </div>
                )}
              </div>

              {/* Text messages body */}
              <div className="flex-1 space-y-1 min-w-0 relative">
                {/* Message Header (Sender Name + Time) */}
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-[#f8fafc] font-mono leading-none">
                    {group.senderName}
                  </span>
                  <span className="text-[9px] text-[#475569] font-mono">
                    {group.timeString}
                  </span>
                </div>

                {/* Sub-messages loop */}
                <div className="space-y-1.5 pt-0.5">
                  {group.messages.map((msg) => {
                    const hasReactions = msg.reactions && msg.reactions.length > 0;
                    return (
                      <div key={msg._id || msg.id} className="relative group/msg-bubble space-y-1">
                        {/* Text bubble */}
                        <div className="text-xs text-[#94a3b8] leading-relaxed break-words font-mono bg-[#0f131a]/65 p-2 rounded-lg border border-[#1e293b]/50 select-text max-w-[270px]">
                          {msg.text}
                          {msg.attachments && msg.attachments.map(att => renderAttachment(att))}
                        </div>

                        {/* Reactions render */}
                        {hasReactions && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {msg.reactions.map((rx, rxIdx) => {
                              const didReact = rx.users.includes(user?.id || user?._id || "");
                              return (
                                <button
                                  key={rxIdx}
                                  onClick={() => handleReact(msg._id || msg.id, rx.emoji)}
                                  className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                                    didReact
                                      ? "bg-indigo-950/50 text-indigo-400 border border-indigo-500/30"
                                      : "bg-[#090b11] text-[#64748b] border border-[#1e293b] hover:text-[#e2e8f0]"
                                  }`}
                                >
                                  <span>{rx.emoji}</span>
                                  <span>{rx.users.length}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Floating quick reaction picker on hover (Slack feel) */}
                        <div className="absolute right-0 top-0 -translate-y-[85%] z-20 hidden group-hover/msg-bubble:flex items-center gap-1 px-1.5 py-1 bg-[#171e29] border border-[#334155] rounded-lg shadow-2xl animate-fade-in">
                          {["👍", "🚀", "👀", "🔥", "🎉"].map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => handleReact(msg._id || msg.id, emoji)}
                              className="text-xs hover:scale-125 transition-transform px-1"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Typing Indicators */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 border-t border-[#1e293b]/60 bg-[#090b11]/90 flex items-center gap-2 select-none">
          <div className="flex gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
          </div>
          <span className="text-[9px] text-[#64748b] font-mono truncate leading-none uppercase">
            {typingUsers.map(u => u.name.split(" ")[0]).join(", ")} is typing...
          </span>
        </div>
      )}

      {/* 4. Chat Input Form */}
      <div className="p-4 border-t border-[#1e293b] bg-[#090b11]">
        {/* Attachment preview indicator if selected */}
        {selectedAttachment && (
          <div className="mb-2 p-2 rounded-lg bg-indigo-950/20 border border-indigo-500/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs">📎</span>
              <span className="text-[10px] text-[#f8fafc] font-semibold truncate font-mono">
                {selectedAttachment.name} ({selectedAttachment.type})
              </span>
            </div>
            <button
              onClick={() => setSelectedAttachment(null)}
              className="text-[#64748b] hover:text-rose-400 font-bold text-[10px]"
            >
              REMOVE
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type a message (e.g. #task reference)..."
            className="w-full pl-3 pr-10 py-3 rounded-lg bg-[#0c0e15] border border-[#1e293b] text-xs outline-none text-[#e2e8f0] focus:border-indigo-500/60 font-mono"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-2 top-2 p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-slate-800 disabled:text-[#475569] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9-7-9-7v14z" />
            </svg>
          </button>
        </form>
      </div>
    </aside>
  );
}

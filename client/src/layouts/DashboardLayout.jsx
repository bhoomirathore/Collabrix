import { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import ChatPanel from "../components/chat/ChatPanel";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [events, setEvents] = useState([]);
  const [socket, setSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [notifications, setNotifications] = useState({ chat: 0, engineersSpace: 0 });

  const activeWorkspaceRef = useRef(activeWorkspace);

  // Sync ref to avoid closure capture issues inside socket listeners
  useEffect(() => {
    activeWorkspaceRef.current = activeWorkspace;
  }, [activeWorkspace]);

  // 1. Fetch initial workspaces
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await api.get("/workspaces");
        setWorkspaces(res.data);
        if (res.data.length > 0) {
          // Select default workspace
          setActiveWorkspace(res.data[0]);
        }
      } catch (err) {
        console.error("Fetch workspaces error:", err.message);
      }
    };
    fetchWorkspaces();
  }, []);

  // 2. Fetch data when active workspace changes
  useEffect(() => {
    if (!activeWorkspace) return;
    const wsId = activeWorkspace._id || activeWorkspace.id;

    const fetchWorkspaceData = async () => {
      try {
        const [mRes, tRes, cRes, eRes] = await Promise.all([
          api.get(`/workspaces/${wsId}/members`),
          api.get(`/tasks?workspaceId=${wsId}`),
          api.get(`/chat?workspaceId=${wsId}`),
          api.get(`/engineering/events?workspaceId=${wsId}`)
        ]);

        setMembers(mRes.data);
        setTasks(tRes.data);
        setMessages(cRes.data);
        setEvents(eRes.data);
      } catch (err) {
        console.error("Fetch workspace data error:", err.message);
      }
    };

    fetchWorkspaceData();
  }, [activeWorkspace]);

  // 3. Setup WebSocket connection
  useEffect(() => {
    if (!activeWorkspace || !user) return;
    const wsId = activeWorkspace._id || activeWorkspace.id;
    const token = localStorage.getItem("token");

    const socketUrl = (import.meta.env.VITE_API_URL || "http://localhost:4000/api")
      .replace("/api", "");

    const socketInstance = io(socketUrl, {
      auth: { token: `Bearer ${token}` }
    });

    socketInstance.emit("join-workspace", {
      workspaceId: wsId,
      user: { id: user.id || user._id, name: user.name, avatar: user.avatar }
    });

    setSocket(socketInstance);

    // Socket events
    socketInstance.on("receive-message", (message) => {
      setMessages((prev) => [...prev, message]);
      // Trigger notification if chat drawer is closed
      if (!isChatOpen) {
        setNotifications(prev => ({ ...prev, chat: prev.chat + 1 }));
      }
    });

    socketInstance.on("update-message", (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) =>
          (msg._id === updatedMessage._id || msg.id === updatedMessage.id) ? updatedMessage : msg
        )
      );
    });

    socketInstance.on("task-updated", (updatedTask) => {
      setTasks((prev) =>
        prev.map((t) =>
          (t._id === updatedTask._id || t.id === updatedTask.id) ? updatedTask : t
        )
      );
    });

    socketInstance.on("receive-event", (newEvent) => {
      setEvents((prev) => [newEvent, ...prev]);
      if (location.pathname !== "/dashboard/engineers-space") {
        setNotifications(prev => ({ ...prev, engineersSpace: prev.engineersSpace + 1 }));
      }
    });

    socketInstance.on("typing-state", ({ user: typingUser, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          if (prev.some(u => u.id === typingUser.id || u._id === typingUser._id)) return prev;
          return [...prev, typingUser];
        } else {
          return prev.filter(u => u.id !== typingUser.id && u._id !== typingUser._id);
        }
      });
    });

    socketInstance.on("user-presence-update", ({ userId, status, customStatus }) => {
      setMembers((prev) =>
        prev.map((member) => {
          const mId = member._id || member.id;
          if (mId === userId) {
            return { ...member, status, customStatus };
          }
          return member;
        })
      );
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [activeWorkspace, user]);

  // Reset notifications on navigation
  useEffect(() => {
    if (location.pathname === "/dashboard/engineers-space") {
      setNotifications(prev => ({ ...prev, engineersSpace: 0 }));
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isChatOpen) {
      setNotifications(prev => ({ ...prev, chat: 0 }));
    }
  }, [isChatOpen]);

  const handleTaskMoved = (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) =>
        (t._id === updatedTask._id || t.id === updatedTask.id) ? updatedTask : t
      )
    );
    if (socket) {
      socket.emit("task-moved", updatedTask);
    }
  };

  const handleMessageSent = (newMessage) => {
    setMessages((prev) => [...prev, newMessage]);
    if (socket) {
      socket.emit("send-message", newMessage);
    }
  };

  const handleMessageReaction = (updatedMessage) => {
    setMessages((prev) =>
      prev.map((msg) =>
        (msg._id === updatedMessage._id || msg.id === updatedMessage.id) ? updatedMessage : msg
      )
    );
    if (socket) {
      socket.emit("message-reaction", updatedMessage);
    }
  };

  const handlePresenceChange = (status, customStatus) => {
    if (socket && user) {
      const uId = user.id || user._id;
      socket.emit("change-presence", {
        userId: uId,
        status,
        customStatus
      });
      // Reflect locally
      setMembers((prev) =>
        prev.map((member) => {
          const mId = member._id || member.id;
          if (mId === uId) {
            return { ...member, status, customStatus };
          }
          return member;
        })
      );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090b11] text-[#e2e8f0] font-sans antialiased">
      {/* 1. Sidebar Panel */}
      <Sidebar
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        setActiveWorkspace={setActiveWorkspace}
        notifications={notifications}
        onPresenceChange={handlePresenceChange}
        logout={logout}
      />

      {/* 2. Main Workspace Layout Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative bg-[#090b11]">
        {/* Toggle Chat Bar Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="absolute top-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1e293b] bg-[#0f131a] hover:bg-[#171e29] hover:border-[#334155] text-xs font-medium font-mono text-[#94a3b8] hover:text-[#f8fafc] transition-all shadow-md group"
          id="btn-toggle-chat"
        >
          <span className={`w-2 h-2 rounded-full ${isChatOpen ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`}></span>
          {isChatOpen ? "COLLAPSE FEED" : "LIVE TEAM FEED"}
          {notifications.chat > 0 && (
            <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white font-bold animate-bounce">
              {notifications.chat}
            </span>
          )}
        </button>

        {/* Dynamic Inner Subroute Page */}
        <div className="flex-1 min-w-0 h-full">
          <Outlet
            context={{
              activeWorkspace,
              members,
              tasks,
              messages,
              events,
              setTasks,
              setEvents,
              socket,
              handleTaskMoved,
              handleMessageSent,
              isChatOpen,
              setIsChatOpen
            }}
          />
        </div>
      </main>

      {/* 3. Live Realtime Chat Panel overlay */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        typingUsers={typingUsers}
        socket={socket}
        onMessageSent={handleMessageSent}
        onMessageReaction={handleMessageReaction}
        members={members}
        activeWorkspace={activeWorkspace}
      />
    </div>
  );
}

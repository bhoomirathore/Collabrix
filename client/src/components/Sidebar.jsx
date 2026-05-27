import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({
  workspaces,
  activeWorkspace,
  setActiveWorkspace,
  notifications,
  onPresenceChange,
  logout
}) {
  const { user } = useAuth();
  const location = useLocation();
  
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // Status mapping
  const statusColors = {
    online: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
    away: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
    busy: "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
    offline: "bg-slate-500 shadow-none",
  };

  const menuItems = [
    {
      section: "Workspace",
      links: [
        {
          path: "/dashboard",
          label: "Dashboard",
          badge: null,
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
        },
        {
          path: "/dashboard/engineers-space",
          label: "Engineer's Space",
          badge: notifications.engineersSpace > 0 ? notifications.engineersSpace : null,
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
        },
        {
          path: "/dashboard/resource-hub",
          label: "Resource Hub",
          badge: null,
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
        },
      ],
    },
    {
      section: "Engineering",
      links: [
        {
          path: "/dashboard/wiki",
          label: "Wiki",
          badge: null,
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
        {
          path: "/dashboard/snippets",
          label: "Snippets",
          badge: null,
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          ),
        },
        {
          path: "/dashboard/code-review",
          label: "Code Review",
          badge: null,
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ),
        },
      ],
    },
    {
      section: "Workspace Settings",
      links: [
        {
          path: "/dashboard/billing",
          label: "Billing",
          badge: null,
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          ),
        },
      ],
    },
  ];

  const handleStatusSelect = (status) => {
    onPresenceChange(status, user?.customStatus || "");
    setShowStatusPicker(false);
  };

  const getActiveStatus = () => {
    return user?.status || "online";
  };

  return (
    <aside className="w-64 h-full flex flex-col border-r border-[#1e293b] bg-[#0c0e15] shrink-0 select-none relative z-50">
      
      {/* 1. Workspace Switcher dropdown */}
      <div className="p-4 border-b border-[#1e293b] relative">
        <button
          onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#0f131a] hover:bg-[#171e29] border border-[#1e293b] hover:border-[#334155] transition-all group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md">
              {activeWorkspace?.name?.substring(0, 2).toUpperCase() || "CB"}
            </div>
            <span className="text-sm font-semibold tracking-tight text-[#f8fafc] truncate font-mono">
              {activeWorkspace?.name || "Collabrix Workspace"}
            </span>
          </div>
          <svg className="w-4 h-4 text-[#64748b] group-hover:text-[#94a3b8] transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </button>

        {showWorkspaceDropdown && (
          <div className="absolute top-[calc(100%-8px)] left-4 right-4 z-50 mt-2 py-1 bg-[#0f131a] border border-[#1e293b] rounded-lg shadow-2xl animate-fade-in">
            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-[#475569] uppercase font-mono border-b border-[#1e293b] mb-1">
              Switch Workspace
            </div>
            {workspaces.map((ws) => (
              <button
                key={ws._id || ws.id}
                onClick={() => {
                  setActiveWorkspace(ws);
                  setShowWorkspaceDropdown(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-left transition-colors ${
                  (ws._id === activeWorkspace?._id || ws.id === activeWorkspace?.id)
                    ? "bg-[#171e29] text-indigo-400 font-semibold"
                    : "text-[#94a3b8] hover:bg-[#111622] hover:text-[#f8fafc]"
                }`}
              >
                <span>{ws.name}</span>
                {(ws._id === activeWorkspace?._id || ws.id === activeWorkspace?.id) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.8)]"></span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Navigation items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
        {menuItems.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            <h3 className="px-3 text-[10px] font-bold tracking-widest text-[#475569] uppercase font-mono">
              {section.section}
            </h3>
            <ul className="space-y-0.5">
              {section.links.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-[#161b26] border border-[#273244] text-[#f8fafc] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                          : "text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#0f121a] border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`transition-colors duration-150 ${isActive ? 'text-indigo-400' : 'text-[#475569]'}`}>
                          {link.icon}
                        </span>
                        <span className="font-mono">{link.label}</span>
                      </div>
                      {link.badge && (
                        <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-indigo-600/90 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(99,102,241,0.5)]">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* 3. Bottom profile section */}
      <div className="p-4 border-t border-[#1e293b] bg-[#090b11]/80 backdrop-blur-md relative">
        <div className="flex items-center justify-between">
          
          {/* User Profile Trigger button */}
          <button
            onClick={() => setShowStatusPicker(!showStatusPicker)}
            className="flex items-center gap-3 min-w-0 text-left hover:opacity-90 transition-opacity relative group"
            title="Change presence status"
          >
            {/* Avatar block with presence dot */}
            <div className="relative shrink-0 select-none">
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                alt={user?.name || "Developer"}
                className="w-8 h-8 rounded-full border border-[#1e293b] object-cover group-hover:border-indigo-500/50 transition-colors"
              />
              <span className={`absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full border border-[#0c0e15] ${statusColors[getActiveStatus()]}`}></span>
            </div>
            {/* Name/Status labels */}
            <div className="min-w-0 flex flex-col">
              <span className="text-xs font-semibold text-[#f8fafc] truncate font-mono leading-none mb-0.5">
                {user?.name || "Developer Profile"}
              </span>
              <span className="text-[10px] text-[#64748b] truncate font-mono max-w-[120px]">
                {user?.customStatus || user?.status || "developer"}
              </span>
            </div>
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-1.5 rounded-md hover:bg-[#171e29] border border-transparent hover:border-[#1e293b] text-[#475569] hover:text-rose-400 transition-all shrink-0"
            title="Exit Session"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {/* Presence status picker card */}
        {showStatusPicker && (
          <div className="absolute bottom-[calc(100%+8px)] left-4 right-4 z-50 p-2 bg-[#0f131a] border border-[#1e293b] rounded-lg shadow-2xl animate-fade-in space-y-1">
            <div className="px-2 py-1 text-[9px] font-bold tracking-wider text-[#475569] uppercase font-mono border-b border-[#1e293b] mb-1">
              Select Presence State
            </div>
            {Object.keys(statusColors).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusSelect(status)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#94a3b8] hover:bg-[#111622] hover:text-[#f8fafc] rounded-md transition-colors font-mono text-left"
              >
                <span className={`w-2 h-2 rounded-full ${statusColors[status]}`}></span>
                <span className="capitalize">{status}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import api from "../lib/axios";

export default function Dashboard() {
  const {
    activeWorkspace,
    members,
    tasks,
    setTasks,
    handleTaskMoved,
    socket,
    setIsChatOpen
  } = useOutletContext();

  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("all");
  const [activePriority, setActivePriority] = useState("all");
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  const [newTaskData, setNewTaskData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    assignee: "",
    category: "frontend",
    sprint: "Sprint 3: Core Reliability",
    storyPoints: 3,
  });

  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const columns = [
    { id: "todo", label: "To Do", border: "border-t-2 border-t-indigo-500/50" },
    { id: "in_progress", label: "In Progress", border: "border-t-2 border-t-amber-500/50" },
    { id: "review", label: "In Review", border: "border-t-2 border-t-purple-500/50" },
    { id: "done", label: "Done", border: "border-t-2 border-t-emerald-500/50" },
  ];

  const priorityColors = {
    urgent: "bg-rose-950/50 text-rose-400 border border-rose-800/40",
    high: "bg-amber-950/50 text-amber-400 border border-amber-800/40",
    medium: "bg-indigo-950/50 text-indigo-400 border border-indigo-800/40",
    low: "bg-slate-900 text-slate-400 border border-slate-700/40",
  };

  const categoryIcons = {
    frontend: "🎨",
    backend: "⚙️",
    devops: "🚀",
    docs: "📝",
    general: "🛠️",
  };

  // Draggable Handlers
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("text/plain", taskId);
    e.currentTarget.style.opacity = "0.4";
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (!taskId) return;

    const matchedTask = tasks.find(t => t._id === taskId || t.id === taskId);
    if (matchedTask && matchedTask.status !== columnId) {
      const originalTasks = [...tasks];
      // Optimistic Update
      setTasks(prev =>
        prev.map(t => (t._id === taskId || t.id === taskId) ? { ...t, status: columnId } : t)
      );

      try {
        const res = await api.patch(`/tasks/${taskId}`, { status: columnId });
        handleTaskMoved(res.data);
      } catch (err) {
        console.error("Task move failed, reverting:", err.message);
        setTasks(originalTasks);
      }
    }
    setDragOverColumn(null);
  };

  // Task creation handler
  const handleCreateTask = async (e) => {
    e.preventDefault();
    const wsId = activeWorkspace?._id || activeWorkspace?.id;
    if (!wsId || !newTaskData.title.trim()) return;

    try {
      const res = await api.post("/tasks", {
        ...newTaskData,
        workspaceId: wsId,
      });
      
      setTasks(prev => [...prev, res.data]);
      if (socket) {
        socket.emit("log-event", {
          type: "task_moved",
          message: `${res.data.assignee ? "Teammate" : "Someone"} created task '${res.data.title}'`,
          workspaceId: wsId
        });
      }
      
      setShowAddTaskModal(false);
      setNewTaskData({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        assignee: "",
        category: "frontend",
        sprint: "Sprint 3: Core Reliability",
        storyPoints: 3,
      });
    } catch (err) {
      console.error("Create task error:", err.message);
      alert("Failed to create task");
    }
  };

  // Inspect and update assignee dynamically
  const handleAssigneeChange = async (taskId, assigneeId) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, { assignee: assigneeId || null });
      setTasks(prev => prev.map(t => (t._id === taskId || t.id === taskId) ? res.data : t));
      if (selectedTask) {
        setSelectedTask(res.data);
      }
      if (socket) {
        socket.emit("task-moved", res.data);
      }
    } catch (err) {
      console.error("Assignee update failed:", err.message);
    }
  };

  // Filters logic
  const filteredTasks = tasks.filter(task => {
    const matchCat = activeCategory === "all" || task.category === activeCategory;
    const matchPri = activePriority === "all" || task.priority === activePriority;
    return matchCat && matchPri;
  });

  // Calculate stats
  const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const completedPoints = tasks.filter(t => t.status === "done").reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const completionPercent = totalPoints ? Math.round((completedPoints / totalPoints) * 100) : 0;
  const inProgressCount = tasks.filter(t => t.status === "in_progress").length;

  return (
    <div className="p-6 md:p-8 space-y-6 select-none font-mono">
      {/* 1. Header with details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-5">
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold">Active Sprint Workspace</div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f8fafc]">
            {activeWorkspace?.name || "Workspace Home"} — Sprint Board
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all"
          >
            <span>+</span> NEW ENGINEERING TASK
          </button>
        </div>
      </div>

      {/* 2. Metrics card banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#0f131a] border border-[#1e293b] rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
        
        {/* Progress gauge */}
        <div className="space-y-1">
          <div className="text-[10px] uppercase text-[#64748b] font-bold">Sprint Commitment</div>
          <div className="text-xl font-bold text-[#f8fafc]">{completedPoints} / {totalPoints} <span className="text-xs text-[#64748b]">Story Points</span></div>
          <div className="w-full bg-[#171e29] h-1.5 rounded-full overflow-hidden mt-2 border border-[#1e293b]">
            <div className="bg-indigo-500 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(99,102,241,0.8)]" style={{ width: `${completionPercent}%` }}></div>
          </div>
          <div className="text-[9px] text-indigo-400 mt-1">{completionPercent}% total weight done</div>
        </div>

        <div className="space-y-1 border-t md:border-t-0 md:border-l border-[#1e293b] pt-3 md:pt-0 md:pl-5">
          <div className="text-[10px] uppercase text-[#64748b] font-bold">Total Backlog</div>
          <div className="text-xl font-bold text-[#f8fafc]">{tasks.length} <span className="text-xs text-[#64748b]">Active Tasks</span></div>
          <div className="text-[9px] text-[#64748b]">across all 4 workflow states</div>
        </div>

        <div className="space-y-1 border-t md:border-t-0 md:border-l border-[#1e293b] pt-3 md:pt-0 md:pl-5">
          <div className="text-[10px] uppercase text-[#64748b] font-bold">Teammates Working</div>
          <div className="text-xl font-bold text-amber-400">{inProgressCount} <span className="text-xs text-[#64748b]">In Progress</span></div>
          <div className="text-[9px] text-amber-500/80 animate-pulse">active developer sync ongoing</div>
        </div>

        <div className="space-y-1 border-t md:border-t-0 md:border-l border-[#1e293b] pt-3 md:pt-0 md:pl-5">
          <div className="text-[10px] uppercase text-[#64748b] font-bold">Current Milestone</div>
          <div className="text-xs font-bold text-indigo-300 truncate">Sprint 3: Core Reliability</div>
          <div className="text-[9px] text-[#64748b]">Ends in 11 days (sliding window)</div>
        </div>
      </div>

      {/* 3. Filters block */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0c0e15] border border-[#1e293b] p-3 rounded-lg">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-[#475569] mr-1">Stack Filter:</span>
          {["all", "frontend", "backend", "devops", "docs"].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                activeCategory === cat
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#171e29]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-[#475569] mr-1">Priority:</span>
          {["all", "urgent", "high", "medium", "low"].map(pri => (
            <button
              key={pri}
              onClick={() => setActivePriority(pri)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${
                activePriority === pri
                  ? "bg-[#1e293b] text-indigo-400 border border-indigo-500/30"
                  : "text-[#64748b] hover:text-[#e2e8f0]"
              }`}
            >
              {pri}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Kanban board columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {columns.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          const isOver = dragOverColumn === col.id;
          
          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col bg-[#0b0c12]/60 border border-[#1e293b]/70 rounded-xl p-4 min-h-[500px] transition-colors duration-250 ${col.border} ${
                isOver ? "bg-indigo-950/20 border-indigo-500/40" : ""
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]/50 mb-4">
                <span className="text-xs font-bold text-[#e2e8f0] font-mono tracking-tight uppercase">
                  {col.label}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#161b26] border border-[#273244] text-[10px] font-bold text-[#64748b] font-mono">
                  {colTasks.length}
                </span>
              </div>

              {/* Task list container */}
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                {colTasks.length === 0 ? (
                  <div className="h-24 flex items-center justify-center border border-dashed border-[#1e293b]/50 rounded-lg text-[9px] text-[#475569] uppercase font-mono">
                    Drop items here
                  </div>
                ) : (
                  colTasks.map(task => {
                    const assigneeUser = members.find(m => (m._id === task.assignee || m.id === task.assignee));
                    return (
                      <div
                        key={task._id || task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id || task.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedTask(task)}
                        className="p-3 bg-[#0f131a] hover:bg-[#141a24] border border-[#1e293b] hover:border-[#334155] rounded-lg shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all group duration-150"
                      >
                        {/* Meta Tags */}
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${priorityColors[task.priority]}`}>
                            {task.priority}
                          </span>
                          <span className="text-[10px] text-[#475569] font-mono">
                            {categoryIcons[task.category] || "🛠️"} {task.category}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-semibold text-[#f8fafc] group-hover:text-indigo-400 transition-colors leading-tight mb-3 tracking-tight font-mono">
                          {task.title}
                        </h4>

                        {/* Details row */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#1e293b]/60">
                          {/* Story points indicator */}
                          <div className="flex items-center gap-1 text-[9px] font-mono text-[#64748b]">
                            <svg className="w-3 h-3 text-indigo-500/70" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a.75.75 0 00-.708.522L3.547 10.24a.75.75 0 00.293.843l5.25 3.563a.75.75 0 00.82 0l5.25-3.562a.75.75 0 00.293-.843l-2.012-6.263a.75.75 0 00-.707-.522H6.268zM5.23 9.75h9.54l-1.36-4.25H6.59L5.23 9.75z" clipRule="evenodd" />
                            </svg>
                            <span>SP: {task.storyPoints || 1}</span>
                          </div>

                          {/* Assignee Avatar */}
                          <div className="relative shrink-0">
                            {assigneeUser ? (
                              <img
                                src={assigneeUser.avatar}
                                alt={assigneeUser.name}
                                className="w-5 h-5 rounded-full object-cover border border-[#1e293b] ring-1 ring-indigo-500/20"
                                title={`Assigned to ${assigneeUser.name}`}
                              />
                            ) : (
                              <span className="block w-5 h-5 rounded-full border border-dashed border-[#475569] flex items-center justify-center text-[8px] text-[#475569]" title="Unassigned">
                                ?
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. ADD TASK MODAL OVERLAY */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-[#090b11]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0f131a] border border-[#1e293b] rounded-xl shadow-2xl overflow-hidden animate-fade-in p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <h3 className="text-sm font-bold text-[#f8fafc] uppercase tracking-wide">
                Create New Engineering Task
              </h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="text-[#64748b] hover:text-[#f8fafc] transition-colors text-xs font-bold"
              >
                ✕ CLOSE
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#64748b] uppercase">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement Jwt Refresh Blacklisting"
                  value={newTaskData.title}
                  onChange={e => setNewTaskData({ ...newTaskData, title: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0] focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase">Category</label>
                  <select
                    value={newTaskData.category}
                    onChange={e => setNewTaskData({ ...newTaskData, category: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0]"
                  >
                    <option value="frontend">Frontend 🎨</option>
                    <option value="backend">Backend ⚙️</option>
                    <option value="devops">DevOps 🚀</option>
                    <option value="docs">Docs 📝</option>
                    <option value="general">General 🛠️</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase">Priority</label>
                  <select
                    value={newTaskData.priority}
                    onChange={e => setNewTaskData({ ...newTaskData, priority: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0]"
                  >
                    <option value="low">Low ⬇️</option>
                    <option value="medium">Medium ➡️</option>
                    <option value="high">High ⬆️</option>
                    <option value="urgent">Urgent 🚨</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase">Assignee</label>
                  <select
                    value={newTaskData.assignee}
                    onChange={e => setNewTaskData({ ...newTaskData, assignee: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0]"
                  >
                    <option value="">Unassigned</option>
                    {members.map(member => (
                      <option key={member._id || member.id} value={member._id || member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase">Story Points</label>
                  <input
                    type="number"
                    min="1"
                    max="13"
                    value={newTaskData.storyPoints}
                    onChange={e => setNewTaskData({ ...newTaskData, storyPoints: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#64748b] uppercase">Description</label>
                <textarea
                  rows="3"
                  placeholder="Provide explicit technical specs of the task..."
                  value={newTaskData.description}
                  onChange={e => setNewTaskData({ ...newTaskData, description: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0] focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#1e293b] text-xs text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#171e29]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white"
                >
                  PROPOSE TASK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. TASK DETAIL MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-[#090b11]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0f131a] border border-[#1e293b] rounded-xl shadow-2xl overflow-hidden animate-fade-in p-6 space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#1e293b] pb-3">
              <div className="space-y-1 pr-4 min-w-0">
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${priorityColors[selectedTask.priority]}`}>
                  {selectedTask.priority} Priority
                </span>
                <h3 className="text-sm font-bold text-[#f8fafc] truncate tracking-tight uppercase leading-snug">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-[#64748b] hover:text-[#f8fafc] transition-colors font-bold text-xs shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Content info */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#171e29] border border-[#1e293b] rounded-lg text-[#94a3b8] whitespace-pre-wrap leading-relaxed">
                {selectedTask.description || "No technical description provided."}
              </div>

              {/* Assignment Controls */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#1e293b]/60">
                <div>
                  <div className="text-[10px] font-bold text-[#64748b] uppercase mb-1">Developer Assigned</div>
                  <select
                    value={selectedTask.assignee || ""}
                    onChange={e => handleAssigneeChange(selectedTask._id || selectedTask.id, e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#171e29] border border-[#1e293b] text-xs outline-none text-[#e2e8f0]"
                  >
                    <option value="">Unassigned</option>
                    {members.map(member => (
                      <option key={member._id || member.id} value={member._id || member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <div className="text-[10px] font-bold text-[#64748b] uppercase mb-1.5">Weight metrics</div>
                  <div className="text-xs text-[#94a3b8] font-mono leading-none">
                    Points: <span className="text-indigo-400 font-bold">{selectedTask.storyPoints || 1} SP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action links */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#1e293b]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedTask(null);
                    setIsChatOpen(true);
                  }}
                  className="px-3 py-1.5 rounded bg-[#171e29] border border-[#1e293b] text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  💬 CHAT DISCUSS
                </button>
              </div>

              <button
                onClick={() => {
                  setSelectedTask(null);
                  navigate(`/dashboard/code-review?taskId=${selectedTask._id || selectedTask.id}`);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white tracking-wide"
              >
                🤖 RUN AI CODE REVIEW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
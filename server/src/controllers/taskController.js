import Task from "../models/Task.js";
import Event from "../models/Event.js";
import User from "../models/User.js";

export const getTasks = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ message: "Workspace ID is required" });
    }

    const tasks = await Task.find({ workspaceId });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, assignee, workspaceId, category, sprint, storyPoints } = req.body;
    const userId = req.user._id || req.user.id;

    if (!title || !workspaceId) {
      return res.status(400).json({ message: "Title and Workspace ID are required" });
    }

    const task = await Task.create({
      title,
      description: description || "",
      status: status || "todo",
      priority: priority || "medium",
      assignee: assignee || null,
      workspaceId,
      category: category || "general",
      sprint: sprint || "Sprint 1",
      storyPoints: Number(storyPoints) || 1,
    });

    // Automatically log this engineering event
    await Event.create({
      type: "task_moved",
      message: `${req.user.name} created task: '${title}'`,
      user: userId,
      workspaceId,
      targetType: "task",
      targetId: task._id,
      meta: { status: task.status, priority: task.priority }
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user._id || req.user.id;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const oldStatus = task.status;
    const oldAssigneeId = task.assignee;

    const updatedTask = await Task.findByIdAndUpdate(id, updates, { new: true });

    // Auto-log status changes
    if (updates.status && updates.status !== oldStatus) {
      let statusLabel = updates.status.replace("_", " ");
      await Event.create({
        type: "task_moved",
        message: `${req.user.name} moved '${task.title}' to ${statusLabel}`,
        user: userId,
        workspaceId: task.workspaceId,
        targetType: "task",
        targetId: task._id,
        meta: { status: updates.status, oldStatus }
      });
    }

    // Auto-log assignee changes
    if (updates.assignee !== undefined && updates.assignee !== oldAssigneeId) {
      let assigneeName = "unassigned";
      if (updates.assignee) {
        const assigneeUser = await User.findById(updates.assignee);
        if (assigneeUser) assigneeName = assigneeUser.name;
      }
      
      await Event.create({
        type: "task_moved",
        message: `${req.user.name} assigned '${task.title}' to ${assigneeName}`,
        user: userId,
        workspaceId: task.workspaceId,
        targetType: "task",
        targetId: task._id,
      });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await Task.deleteOne({ _id: id });
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

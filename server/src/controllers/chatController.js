import Message from "../models/Message.js";
import Event from "../models/Event.js";
import User from "../models/User.js";

export const getMessages = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ message: "Workspace ID is required" });
    }

    const messages = await Message.find({ workspaceId })
      .sort({ createdAt: 1 })
      .populate("sender");

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, workspaceId, attachments } = req.body;
    const userId = req.user._id || req.user.id;

    if (!text || !workspaceId) {
      return res.status(400).json({ message: "Text and Workspace ID are required" });
    }

    const message = await Message.create({
      text,
      sender: userId,
      workspaceId,
      attachments: attachments || [],
      reactions: [],
    });

    // Populate sender details for the response
    const populated = await Message.findById(message._id).populate("sender");

    // Check if it's a critical discussion or contains system mentions to log a timeline event
    if (text.includes("reconnect") || text.includes("scaling") || text.includes("review")) {
      await Event.create({
        type: "chat_highlight",
        message: `${req.user.name} highlighted in chat: "${text.substring(0, 50)}..."`,
        user: userId,
        workspaceId,
        targetType: "chat",
        targetId: message._id,
      });
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id || req.user.id;

    if (!emoji) {
      return res.status(400).json({ message: "Emoji is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if reaction already exists
    const reactions = message.reactions || [];
    const existingIdx = reactions.findIndex(r => r.emoji === emoji);

    if (existingIdx !== -1) {
      const rx = reactions[existingIdx];
      const userIdx = rx.users.indexOf(userId);
      if (userIdx !== -1) {
        // Toggle off reaction if clicked again
        rx.users.splice(userIdx, 1);
        if (rx.users.length === 0) {
          reactions.splice(existingIdx, 1);
        }
      } else {
        rx.users.push(userId);
      }
    } else {
      reactions.push({
        emoji,
        users: [userId],
      });
    }

    const updated = await Message.findByIdAndUpdate(
      messageId,
      { reactions },
      { new: true }
    ).populate("sender");

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

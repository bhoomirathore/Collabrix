import Wiki from "../models/Wiki.js";
import Snippet from "../models/Snippet.js";
import Resource from "../models/Resource.js";
import Event from "../models/Event.js";

// WIKI HANDLERS
export const getWikis = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) return res.status(400).json({ message: "Workspace ID is required" });
    const wikis = await Wiki.find({ workspaceId }).populate("author");
    res.json(wikis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createWiki = async (req, res) => {
  try {
    const { title, content, workspaceId } = req.body;
    const userId = req.user._id || req.user.id;
    if (!title || !content || !workspaceId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const wiki = await Wiki.create({
      title,
      content,
      author: userId,
      workspaceId,
      slug,
    });

    await Event.create({
      type: "wiki_updated",
      message: `${req.user.name} created wiki article: '${title}'`,
      user: userId,
      workspaceId,
      targetType: "wiki",
      targetId: wiki._id,
    });

    res.status(201).json(wiki);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateWiki = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user._id || req.user.id;

    const wiki = await Wiki.findById(id);
    if (!wiki) return res.status(404).json({ message: "Wiki not found" });

    const slug = title ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : wiki.slug;

    const updated = await Wiki.findByIdAndUpdate(
      id,
      { title: title || wiki.title, content: content || wiki.content, slug },
      { new: true }
    );

    await Event.create({
      type: "wiki_updated",
      message: `${req.user.name} updated wiki article: '${updated.title}'`,
      user: userId,
      workspaceId: wiki.workspaceId,
      targetType: "wiki",
      targetId: wiki._id,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SNIPPET HANDLERS
export const getSnippets = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) return res.status(400).json({ message: "Workspace ID is required" });
    const snippets = await Snippet.find({ workspaceId }).populate("author");
    res.json(snippets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSnippet = async (req, res) => {
  try {
    const { title, code, language, description, workspaceId } = req.body;
    const userId = req.user._id || req.user.id;

    if (!title || !code || !workspaceId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const snippet = await Snippet.create({
      title,
      code,
      language: language || "javascript",
      description: description || "",
      author: userId,
      workspaceId,
    });

    await Event.create({
      type: "snippet_created",
      message: `${req.user.name} shared code snippet: '${title}'`,
      user: userId,
      workspaceId,
      targetType: "snippet",
      targetId: snippet._id,
    });

    res.status(201).json(snippet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// RESOURCE HANDLERS
export const getResources = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) return res.status(400).json({ message: "Workspace ID is required" });
    const resources = await Resource.find({ workspaceId });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createResource = async (req, res) => {
  try {
    const { title, url, category, description, annotation, associatedTask, sprint, workspaceId } = req.body;
    const userId = req.user._id || req.user.id;

    if (!title || !url || !workspaceId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const resource = await Resource.create({
      title,
      url,
      category: category || "tool",
      description: description || "",
      annotation: annotation || "",
      savedBy: [userId],
      workspaceId,
      associatedTask: associatedTask || "",
      sprint: sprint || "",
    });

    await Event.create({
      type: "resource_saved",
      message: `${req.user.name} saved resource bookmark: '${title}'`,
      user: userId,
      workspaceId,
      targetType: "resource",
      targetId: resource._id,
    });

    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const saveResource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    let savedBy = resource.savedBy || [];
    if (savedBy.includes(userId)) {
      // Toggle off (unsave)
      savedBy = savedBy.filter(uid => uid !== userId);
    } else {
      savedBy.push(userId);
    }

    const updated = await Resource.findByIdAndUpdate(
      id,
      { savedBy },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// TIMELINE EVENTS FEED
export const getEvents = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) return res.status(400).json({ message: "Workspace ID is required" });
    
    const events = await Event.find({ workspaceId })
      .sort({ createdAt: -1 })
      .populate("user");

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

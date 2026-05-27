import Workspace from "../models/Workspace.js";
import User from "../models/User.js";

export const getWorkspaces = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    // Find workspaces where user is owner or member
    const workspaces = await Workspace.find({
      $or: [{ owner: userId }, { members: userId }]
    });
    
    // In fallback mode or if list is empty, default to our seeded workspace
    if (workspaces.length === 0) {
      const allWorkspaces = await Workspace.find({});
      return res.json(allWorkspaces);
    }
    
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user._id || req.user.id;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const workspace = await Workspace.create({
      name,
      owner: userId,
      members: [userId],
      tier: "pro",
    });

    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWorkspaceMembers = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId).populate("members");
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    
    // If populated members is still list of IDs, resolve them manually
    if (workspace.members && workspace.members.length > 0 && typeof workspace.members[0] === "string") {
      const members = await Promise.all(
        workspace.members.map(async (id) => {
          const user = await User.findById(id).select("-password");
          return user;
        })
      );
      return res.json(members.filter(Boolean));
    }
    
    res.json(workspace.members || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const inviteMember = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User with this email not found" });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const userId = user._id || user.id;
    if (workspace.members.includes(userId)) {
      return res.status(400).json({ message: "User is already a member" });
    }

    const updatedWorkspace = await Workspace.findByIdAndUpdate(
      workspaceId,
      { $push: { members: userId } },
      { new: true }
    );

    res.json({ message: "User invited successfully", workspace: updatedWorkspace });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBilling = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Return realistic billing quotas based on tier
    res.json({
      tier: workspace.tier || "pro",
      billingCycle: "monthly",
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usage: {
        seats: { current: workspace.members.length, limit: 15 },
        storage: { current: 4.8, limit: 50 }, // in GB
        apiRequests: { current: 42344, limit: 500000 },
        aiCredits: { current: 78, limit: 200 }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

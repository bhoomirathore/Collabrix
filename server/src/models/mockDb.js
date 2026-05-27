import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, "..", "config", "database.json");

// Ensure the config directory exists
const dir = path.dirname(DB_FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// In-memory data store
let store = {
  users: [],
  workspaces: [],
  tasks: [],
  messages: [],
  wikis: [],
  snippets: [],
  resources: [],
  events: [],
};

// Load data from file if it exists
const loadData = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      if (data.trim()) {
        const parsed = JSON.parse(data);
        store = { ...store, ...parsed };
      }
    }
  } catch (err) {
    console.error("Error loading database file, initializing empty:", err.message);
  }
};

// Save data to file
export const saveData = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database file:", err.message);
  }
};

// Load initial data
loadData();

// Simple ID Generator
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

class QueryChain {
  constructor(data) {
    this.data = data;
  }

  sort(sortObj) {
    if (!Array.isArray(this.data)) return this;
    const [key, dir] = Object.entries(sortObj)[0] || [];
    if (!key) return this;
    
    this.data = [...this.data].sort((a, b) => {
      let valA = a[key];
      let valB = b[key];
      
      // Handle Date comparison
      if (valA instanceof Date) valA = valA.getTime();
      if (valB instanceof Date) valB = valB.getTime();
      if (typeof valA === "string" && !isNaN(Date.parse(valA))) valA = new Date(valA).getTime();
      if (typeof valB === "string" && !isNaN(Date.parse(valB))) valB = new Date(valB).getTime();

      if (valA < valB) return dir === -1 || dir === "desc" ? 1 : -1;
      if (valA > valB) return dir === -1 || dir === "desc" ? -1 : 1;
      return 0;
    });
    return this;
  }

  populate(field) {
    // Simulates simple Mongoose populate
    if (!Array.isArray(this.data)) {
      this.populateItem(this.data, field);
      return this;
    }
    this.data.forEach(item => this.populateItem(item, field));
    return this;
  }

  populateItem(item, field) {
    if (!item || !item[field]) return;
    
    // Resolve user reference
    if (field === "user" || field === "sender" || field === "author" || field === "owner") {
      const userId = typeof item[field] === "object" ? item[field]._id || item[field].id : item[field];
      const matchedUser = store.users.find(u => u._id === userId || u.id === userId);
      if (matchedUser) {
        item[field] = {
          id: matchedUser._id,
          _id: matchedUser._id,
          name: matchedUser.name,
          email: matchedUser.email,
          avatar: matchedUser.avatar,
        };
      }
    }
    
    // Resolve workspace members
    if (field === "members") {
      const memberIds = item.members || [];
      item.members = memberIds.map(id => {
        const u = store.users.find(user => user._id === id || user.id === id);
        return u ? { id: u._id, _id: u._id, name: u.name, email: u.email, avatar: u.avatar } : id;
      });
    }
  }

  limit(num) {
    if (Array.isArray(this.data)) {
      this.data = this.data.slice(0, num);
    }
    return this;
  }

  then(onResolve, onReject) {
    return Promise.resolve(this.data).then(onResolve, onReject);
  }
}

export class MockModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  get collection() {
    if (!store[this.collectionName]) {
      store[this.collectionName] = [];
    }
    return store[this.collectionName];
  }

  set collection(val) {
    store[this.collectionName] = val;
  }

  _match(item, query) {
    if (!query || Object.keys(query).length === 0) return true;
    for (const [key, value] of Object.entries(query)) {
      if (value && typeof value === "object" && "$ne" in value) {
        if (item[key] === value.$ne) return false;
      } else if (value && typeof value === "object" && "$in" in value) {
        if (!value.$in.includes(item[key])) return false;
      } else {
        if (item[key] !== value) return false;
      }
    }
    return true;
  }

  find(query = {}) {
    const results = this.collection.filter(item => this._match(item, query));
    return new QueryChain(JSON.parse(JSON.stringify(results)));
  }

  findOne(query = {}) {
    const result = this.collection.find(item => this._match(item, query));
    return new QueryChain(result ? JSON.parse(JSON.stringify(result)) : null);
  }

  findById(id) {
    const result = this.collection.find(item => item._id === id || item.id === id);
    return new QueryChain(result ? JSON.parse(JSON.stringify(result)) : null);
  }

  async create(data) {
    const newDoc = {
      _id: generateId(),
      id: null,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    newDoc.id = newDoc._id;
    this.collection.push(newDoc);
    saveData();
    return JSON.parse(JSON.stringify(newDoc));
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const idx = this.collection.findIndex(item => item._id === id || item.id === id);
    if (idx === -1) return null;
    
    // Resolve updates (handles $push, $pull, etc.)
    const doc = this.collection[idx];
    const newDoc = { ...doc };
    
    if (update.$push) {
      for (const [key, val] of Object.entries(update.$push)) {
        if (!Array.isArray(newDoc[key])) newDoc[key] = [];
        newDoc[key].push(val);
      }
    } else if (update.$pull) {
      for (const [key, val] of Object.entries(update.$pull)) {
        if (Array.isArray(newDoc[key])) {
          newDoc[key] = newDoc[key].filter(item => item !== val);
        }
      }
    } else {
      Object.assign(newDoc, update);
    }
    
    newDoc.updatedAt = new Date().toISOString();
    this.collection[idx] = newDoc;
    saveData();
    return JSON.parse(JSON.stringify(newDoc));
  }

  async findOneAndUpdate(query, update, options = {}) {
    const idx = this.collection.findIndex(item => this._match(item, query));
    if (idx === -1) return null;
    
    const doc = this.collection[idx];
    const newDoc = { ...doc, ...update, updatedAt: new Date().toISOString() };
    this.collection[idx] = newDoc;
    saveData();
    return JSON.parse(JSON.stringify(newDoc));
  }

  async deleteOne(query) {
    const idx = this.collection.findIndex(item => this._match(item, query));
    if (idx !== -1) {
      this.collection.splice(idx, 1);
      saveData();
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async countDocuments(query = {}) {
    return this.collection.filter(item => this._match(item, query)).length;
  }
}

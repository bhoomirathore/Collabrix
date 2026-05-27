import mongoose from "mongoose";
import { isMongoConnected } from "../config/db.js";
import { MockModel } from "./mockDb.js";

export const createModel = (modelName, schemaDef, collectionName) => {
  let MongooseModel;
  try {
    const schema = new mongoose.Schema(schemaDef, { timestamps: true });
    MongooseModel = mongoose.models[modelName] || mongoose.model(modelName, schema);
  } catch (err) {
    MongooseModel = mongoose.models[modelName];
  }

  const mockModel = new MockModel(collectionName);

  const modelWrapper = new Proxy(MongooseModel, {
    get(target, prop) {
      // Dynamic routing
      if (isMongoConnected) {
        return Reflect.get(target, prop);
      }

      if (prop in mockModel) {
        const value = mockModel[prop];
        if (typeof value === "function") {
          return value.bind(mockModel);
        }
        return value;
      }

      return Reflect.get(target, prop);
    },

    construct(target, args) {
      if (isMongoConnected) {
        return Reflect.construct(target, args);
      }
      // Return object with _id and dates when initialized with new keyword
      const data = args[0] || {};
      if (!data._id && !data.id) {
        data._id = Math.random().toString(36).substring(2, 15);
        data.id = data._id;
      }
      if (!data.createdAt) data.createdAt = new Date().toISOString();
      if (!data.updatedAt) data.updatedAt = new Date().toISOString();
      
      // Simulate save method
      data.save = async function() {
        return mockModel.findByIdAndUpdate(this._id || this.id, this);
      };
      
      return data;
    }
  });

  return modelWrapper;
};

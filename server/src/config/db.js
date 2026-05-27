import mongoose from "mongoose";

let isMongoConnected = false;

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URL) {
      console.warn("⚠️ MONGO_URL not provided. Falling back to persistent JSON-file database.");
      isMongoConnected = false;
      return;
    }
    await mongoose.connect(process.env.MONGO_URL);
    console.log("🚀 MongoDB connected successfully");
    isMongoConnected = true;
  } catch (error) {
    console.warn("⚠️ MongoDB connection failed. Falling back to persistent JSON-file database. Error:", error.message);
    isMongoConnected = false;
  }
};

export { isMongoConnected };
export default connectDB;
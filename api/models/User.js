import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  // This is the unique ID provided by Clerk authentication
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
  },
  // This will store an array of IDs that reference documents in our 'Build' collection
  savedBuilds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Build", // This tells Mongoose to look in the 'Build' model
    },
  ],
  // This will store an array of IDs that reference documents in our 'ChatHistory' collection
  chatHistories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatHistory", // This tells Mongoose to look in the 'ChatHistory' model
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);

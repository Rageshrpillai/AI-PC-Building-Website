import mongoose from "mongoose";

const PrebuiltPartSchema = new mongoose.Schema(
  {
    category: { type: String, required: true }, // e.g. 'cpu', 'ram'
    id: { type: String, required: true },
  },
  { _id: false }
);

const PrebuiltSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: [String],
    required: true, // e.g. ['gaming', 'workstation']
  },
  price: {
    type: Number,
    required: true,
  },
  rating: {
    type: Number,
  },
  imageUrl: {
    type: String,
  },
  galleryImages: [{ type: String, default: [] }],
  description: {
    type: String,
  },
  createdBy: {
    type: String,
    required: true,
  },
  isOfficial: {
    type: Boolean,
    default: false,
  },
  features: [{ type: String, default: [] }],
  parts: [PrebuiltPartSchema],
});

export default mongoose.models.Prebuilt ||
  mongoose.model("Prebuilt", PrebuiltSchema);

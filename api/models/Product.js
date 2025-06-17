import mongoose from "mongoose";

// The final, robust blueprint for all individual components
const ProductSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  brand: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      "cpu",
      "gpu",
      "motherboard",
      "ram",
      "storage",
      "psu",
      "case",
      "cooler",
    ],
  },
  imageUrls: [{ type: String }],
  description: {
    type: String,
    default: "No detailed description available.",
  },
  // We use Mixed to handle different spec structures (e.g., some have arrays, some have strings)
  technicalSpecs: {
    type: mongoose.Schema.Types.Mixed,
  },
  specs: {
    type: mongoose.Schema.Types.Mixed,
  },
  rating: {
    rate: Number,
    count: Number,
  },
});
ProductSchema.index({ id: 1 });

export default mongoose.models.Product ||
  mongoose.model("Product", ProductSchema);

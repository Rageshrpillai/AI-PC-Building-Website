import mongoose from "mongoose";

// Updated Product schema including the new fields
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
  galleryImages: [{ type: String }], // ✅ new field added
  description: {
    type: String,
    default: "No detailed description available.",
  },
  features: [{ type: String }], // ✅ new field added
  compatibleDevices: [{ type: String }], // ✅ new field added
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

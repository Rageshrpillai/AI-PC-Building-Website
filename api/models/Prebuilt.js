import mongoose from "mongoose";

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
  price: {
    type: Number,
    required: true,
  },
  rating: {
    type: Number,
  },
  // This will be the main card image
  imageUrl: {
    type: String,
  },
  // An array of strings for the smaller gallery images on the detail page
  galleryImages: [{ type: String }],
  description: {
    type: String,
  },
  // This will store an array of the parts that make up the prebuilt PC
  parts: [
    {
      category: String,
      id: String,
    },
  ],
});

export default mongoose.models.Prebuilt ||
  mongoose.model("Prebuilt", PrebuiltSchema);

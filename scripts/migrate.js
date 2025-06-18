import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";

import Product from "../api/models/Product.js";
import Prebuilt from "../api/models/Prebuilt.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGO_URI = process.env.MONGO_URI;

const componentFiles = [
  "cpus.json",
  "gpus.json",
  "motherboards.json",
  "rams.json",
  "storages.json",
  "psus.json",
  "cases.json",
  "coolers.json",
];

const getCategoryKeyFromFile = (filename) => {
  return filename.replace(".json", "").replace(/s$/, "");
};

const migrateData = async () => {
  if (!MONGO_URI) {
    console.error("MONGO_URI not found in .env.local. Please add it.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully!");

    // --- Migrate Individual Components ---
    console.log('Clearing existing "products" collection...');
    await Product.deleteMany({});

    let allProductsToInsert = [];
    for (const fileName of componentFiles) {
      const filePath = path.join(process.cwd(), "public", "data", fileName);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(fileContent);
      console.log(`Processing ${data.length} items from ${fileName}`);

      const categoryKey = getCategoryKeyFromFile(fileName);

      const processedData = data.map((product) => ({
        ...product,
        category: categoryKey,
        description:
          product.description ||
          `This is a detailed description for ${product.name}.`,
        technicalSpecs: product.specs,
        imageUrls: product.imageUrl
          ? [product.imageUrl]
          : product.imageUrls || [],
        galleryImages: Array.isArray(product.galleryImages)
          ? product.galleryImages
          : product.imageUrls
          ? [...product.imageUrls]
          : [],
        features: Array.isArray(product.features) ? product.features : [],
        compatibleDevices: Array.isArray(product.compatibleDevices)
          ? product.compatibleDevices
          : [],
      }));

      allProductsToInsert = allProductsToInsert.concat(processedData);
    }

    console.log(`Total products to insert: ${allProductsToInsert.length}`);
    await Product.insertMany(allProductsToInsert);
    console.log("✅ Successfully inserted all products!");

    // --- Migrate Prebuilt PCs ---
    console.log('\nClearing existing "prebuilts" collection...');
    await Prebuilt.deleteMany({});

    const prebuiltFilePath = path.join(
      process.cwd(),
      "public",
      "data",
      "prebuilds.json"
    );
    const prebuiltFileContent = fs.readFileSync(prebuiltFilePath, "utf-8");
    const prebuiltData = JSON.parse(prebuiltFileContent);

    // NEW: process to match new schema, keep galleryImages, category, features, parts as-is from file!
    const processedPrebuilts = prebuiltData.map((p) => ({
      id: p.id,
      name: p.name,
      category: Array.isArray(p.category) ? p.category : [p.category],
      price: p.price,
      rating: p.rating,
      imageUrl: p.imageUrl,
      galleryImages: Array.isArray(p.galleryImages)
        ? p.galleryImages
        : p.imageUrl
        ? [p.imageUrl]
        : [],
      description: p.description,
      features: Array.isArray(p.features) ? p.features : [],
      parts: Array.isArray(p.parts) ? p.parts : [],
      // 👇 ADD THESE LINES!
      createdBy: p.createdBy || "admin",
      isOfficial: typeof p.isOfficial === "boolean" ? p.isOfficial : true,
    }));

    console.log(`Total prebuilt PCs to insert: ${processedPrebuilts.length}`);
    await Prebuilt.insertMany(processedPrebuilts);
    console.log("✅ Successfully inserted all prebuilt PCs!");
  } catch (error) {
    console.error("❌ Error during data migration:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.");
  }
};

migrateData();

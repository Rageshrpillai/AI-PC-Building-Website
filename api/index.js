import express from "express";
import dbConnect from "./lib/dbConnect.js";
import Product from "./models/Product.js";
import Prebuilt from "./models/Prebuilt.js";

// --- NEW IMPORTS ---
import User from "./models/User.js"; // For updating the user's saved builds
import { clerkMiddleware, requireAuth } from "@clerk/express";

const app = express();
// The middleware is configured using environment variables, so the separate Clerk instance was not needed.
app.use(
  clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
    // Note: The JWT key is often read automatically if the variable is set,
    // but being explicit can sometimes help with debugging.
  })
);

console.log("--- VERCEL ENV CHECK ---");
console.log(
  "Publishable Key:",
  process.env.VITE_CLERK_PUBLISHABLE_KEY ? "Loaded" : "MISSING"
);
console.log("Secret Key:", process.env.CLERK_SECRET_KEY ? "Loaded" : "MISSING");
console.log("JWT Key:", process.env.CLERK_JWT_KEY ? "Loaded" : "MISSING");
console.log("--- END VERCEL ENV CHECK ---");
// --- Middleware first! ---
app.use(express.json());
app.use(async (req, res, next) => {
  try {
    await dbConnect();
    next();
  } catch (error) {
    console.error("Database connection error in middleware:", error);
    res.status(500).json({ message: "Database connection failed" });
  }
});

// --- Get ALL products (no pagination, for CustomBuildPage) ---
app.get("/api/products/all", async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json({ data: products });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// --- Batch endpoint for specific IDs ---
app.post("/api/products/batch", requireAuth(), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided." });
    }
    const products = await Product.find({ id: { $in: ids } });
    res.status(200).json({ data: products });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// --- Paginated and filterable GET ---
app.get("/api/products", async (req, res) => {
  try {
    const { category, page = 1, limit = 24 } = req.query;
    const filter = {};
    if (category && category !== "all") {
      filter.category = category.toLowerCase();
    }
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const productsPromise = Product.find(filter).skip(skip).limit(limitNum);
    const countPromise = Product.countDocuments(filter);

    const [products, totalProducts] = await Promise.all([
      productsPromise,
      countPromise,
    ]);

    res.status(200).json({
      data: products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalProducts / limitNum),
        totalProducts: totalProducts,
      },
    });
  } catch (error) {
    console.error("API Error fetching products:", error);
    res.status(500).json({ message: "Server error while fetching products." });
  }
});

// --- Get all Prebuilts ---
app.get("/api/builds", async (req, res) => {
  try {
    const builds = await Prebuilt.find({});
    res.status(200).json({ data: builds });
  } catch (error) {
    console.error("API Error fetching prebuilt PCs:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching prebuilt PCs." });
  }
});

// --- Get single product by ID ---
app.get("/api/products/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ data: product });
  } catch (error) {
    console.error("API Error fetching single product:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching single product." });
  }
});

// --- Get single prebuilt by ID (with resolved parts) ---
app.get("/api/builds/:buildId", requireAuth(), async (req, res) => {
  try {
    const { buildId } = req.params;
    const prebuilt = await Prebuilt.findOne({ id: buildId });
    if (!prebuilt) {
      return res.status(404).json({ message: "Prebuilt PC not found" });
    }

    // --- NEW LOGIC TO HANDLE DUPLICATE PARTS ---
    const partIds = prebuilt.parts.map((part) => part.id);

    const uniqueParts = await Product.find({ id: { $in: partIds } });

    const partsMap = new Map(uniqueParts.map((p) => [p.id, p]));

    const resolvedParts = prebuilt.parts
      .map((partRef) => partsMap.get(partRef.id))
      .filter(Boolean);

    const responseData = {
      ...prebuilt.toObject(),
      resolvedParts: resolvedParts,
    };
    res.status(200).json({ data: responseData });
  } catch (error) {
    console.error("API Error fetching single prebuilt PC:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching single prebuilt PC." });
  }
});

// / --- NEW ROUTE TO SAVE A BUILD ---
app.post("/api/builds/save", requireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { buildName, buildDescription, parts, totalPrice } = req.body;

    if (!buildName || !parts || !totalPrice) {
      return res.status(400).json({ message: "Missing required build data." });
    }

    const newBuild = new Prebuilt({
      id: `user-build-${Date.now()}`, // Generate a simple unique ID
      name: buildName,
      description: buildDescription,
      price: totalPrice,
      parts: parts,
      isUserBuild: true,
      createdBy: userId,
      rating: 0, // Correct: a simple Number as per your schema
      imageUrl: "/images/custom-build-placeholder.png",
    });

    const savedBuild = await newBuild.save();

    await User.findOneAndUpdate(
      { clerkId: userId },
      { $push: { savedBuilds: savedBuild._id } },
      { new: true, upsert: true }
    );

    res
      .status(201)
      .json({ message: "Build saved successfully!", build: savedBuild });
  } catch (error) {
    console.error("API Error saving build:", error);
    res.status(500).json({ message: "Server error while saving build." });
  }
});

app.get("/api/user/builds", requireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const userBuilds = await Prebuilt.find({ createdBy: userId }).sort({
      createdAt: -1,
    });
    res.status(200).json({ data: userBuilds });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching user builds." });
  }
});

app.delete("/api/builds/:id", requireAuth(), async (req, res) => {
  try {
    const buildId = req.params.id;
    const userId = req.auth.userId;

    // Only allow deleting builds the user owns
    const build = await Prebuilt.findById(buildId);
    if (!build || build.createdBy !== userId) {
      return res
        .status(403)
        .json({ message: "Not allowed to delete this build." });
    }

    await Prebuilt.deleteOne({ _id: buildId });

    // Optionally: Remove from user's savedBuilds
    await User.updateOne(
      { clerkId: userId },
      { $pull: { savedBuilds: buildId } }
    );

    res.json({ message: "Build deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error deleting build." });
  }
});
// --- Export for Vercel's serverless environment ---
export default app;

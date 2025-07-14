import express from "express";
import dbConnect from "./lib/dbConnect.js";
import Product from "./models/Product.js";
import Prebuilt from "./models/Prebuilt.js";
import User from "./models/User.js";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import requireAdmin from "./lib/middleware/requireAdmin.js";

const app = express();

app.use(
  clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
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

app.get("/api/products/all", async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json({ data: products });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

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

app.get("/api/builds/:buildId", requireAuth(), async (req, res) => {
  try {
    const auth = req.auth(); // Get auth object
    const userId = auth.userId; // Get userId

    const { buildId } = req.params;
    const prebuilt = await Prebuilt.findOne({ id: buildId });
    if (!prebuilt) {
      return res.status(404).json({ message: "Prebuilt PC not found" });
    }

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

app.post("/api/builds/save", requireAuth(), async (req, res) => {
  // --- START DEBUG LOGS FOR BUILD SAVE ---
  console.log("\n--- DEBUG: Inside POST /api/builds/save route ---");

  // Log the raw req.auth object (the function itself)
  console.log("DEBUG: req.auth is type:", typeof req.auth);
  const auth = req.auth(); // Call auth as a function to get the auth object
  console.log("DEBUG: auth() result:", auth);
  console.log("DEBUG: auth().userId:", auth.userId);
  console.log("DEBUG: auth().user (from auth() object):", auth.user); // Check this value directly from auth()

  // Log req.clerk object details
  console.log("DEBUG: req.clerk is type:", typeof req.clerk);
  if (req.clerk) {
    console.log("DEBUG: req.clerk object keys:", Object.keys(req.clerk));
    console.log("DEBUG: req.clerk.users is type:", typeof req.clerk.users);
    if (req.clerk.users) {
      console.log(
        "DEBUG: req.clerk.users.getUser is type:",
        typeof req.clerk.users.getUser
      );
    }
  } else {
    console.log("DEBUG: req.clerk is undefined or null.");
  }
  // --- END DEBUG LOGS FOR BUILD SAVE ---

  try {
    const userId = auth.userId; // Get userId from the result of auth()

    // Defensive check for userId
    if (!userId) {
      console.error(
        "API Error saving build: userId is missing from auth(). Cannot proceed."
      );
      return res
        .status(401)
        .json({ message: "Unauthorized: User ID not available." });
    }

    // Explicitly fetch the full user object using clerkClient.users.getUser
    // This is the most reliable method for getting full user data including metadata and emails.
    const clerkUser = await clerkClient.users.getUser(userId);

    if (!clerkUser) {
      console.error(
        "API Error saving build: Clerk user object not found for userId:",
        userId
      );
      return res
        .status(500)
        .json({
          message: "Server error: User data could not be retrieved from Clerk.",
        });
    }

    const userEmail = clerkUser.emailAddresses?.[0]?.emailAddress;

    if (!userEmail) {
      console.warn(
        "API Error saving build: User has no primary email address in Clerk for userId:",
        userId
      );
      return res
        .status(400)
        .json({
          message:
            "A primary email address is required to save a build. Please ensure your Clerk account has a verified email.",
        });
    }

    const { buildName, buildDescription, parts, totalPrice } = req.body;

    if (!buildName || !parts || !totalPrice) {
      return res.status(400).json({ message: "Missing required build data." });
    }

    const newBuild = new Prebuilt({
      id: `user-build-${Date.now()}`,
      name: buildName,
      description: buildDescription,
      price: totalPrice,
      parts: parts,
      isUserBuild: true,
      createdBy: userId,
      rating: 0,
      imageUrl: "/images/custom-build-placeholder.png",
    });

    const savedBuild = await newBuild.save();

    await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $push: { savedBuilds: savedBuild._id },
        email: userEmail,
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
      },
      { new: true, upsert: true, runValidators: true }
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
    const auth = req.auth(); // Get auth object
    const userId = auth.userId; // Get userId
    const userBuilds = await Prebuilt.find({ createdBy: userId }).sort({
      createdAt: -1,
    });
    res.status(200).json({ data: userBuilds });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching user builds." });
  }
});

app.post(
  "/api/admin/products",
  requireAuth(),
  requireAdmin,
  async (req, res) => {
    try {
      res
        .status(201)
        .json({ message: "Product created successfully by admin." });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product." });
    }
  }
);

app.delete(
  "/api/admin/products/:id",
  requireAuth(),
  requireAdmin,
  async (req, res) => {
    try {
      res
        .status(200)
        .json({ message: "Product deleted successfully by admin." });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product." });
    }
  }
);

app.delete("/api/builds/:id", requireAuth(), async (req, res) => {
  try {
    const auth = req.auth(); // Get auth object
    const userId = auth.userId; // Get userId

    const buildId = req.params.id;

    const build = await Prebuilt.findById(buildId);
    if (!build || build.createdBy !== userId) {
      return res
        .status(403)
        .json({ message: "Not allowed to delete this build." });
    }

    await Prebuilt.deleteOne({ _id: buildId });

    await User.updateOne(
      { clerkId: userId },
      { $pull: { savedBuilds: buildId } }
    );

    res.json({ message: "Build deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error deleting build." });
  }
});

export default app;

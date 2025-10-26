import express from "express";
import dbConnect from "./lib/dbConnect.js";
import Product from "./models/Product.js";
import Prebuilt from "./models/Prebuilt.js";
import User from "./models/User.js";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import requireAdmin from "./lib/middleware/requireAdmin.js";

const app = express();

// TEMPORARY DEBUG - Remove after testing
console.log("\n=== ENVIRONMENT VARIABLE TEST ===");
console.log(
  "All CLERK vars:",
  Object.keys(process.env).filter((k) => k.includes("CLERK"))
);
console.log(
  "VITE_CLERK_PUBLISHABLE_KEY:",
  process.env.VITE_CLERK_PUBLISHABLE_KEY?.substring(0, 20) + "..."
);
console.log(
  "CLERK_PUBLISHABLE_KEY:",
  process.env.CLERK_PUBLISHABLE_KEY?.substring(0, 20) + "..."
);
console.log("=================================\n");

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

// --- Product Routes ---
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

// --- Prebuilt PC Routes ---
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
      return res.status(500).json({
        message: "Server error: User data could not be retrieved from Clerk.",
      });
    }

    const userEmail = clerkUser.emailAddresses?.[0]?.emailAddress;

    if (!userEmail) {
      console.warn(
        "API Error saving build: User has no primary email address in Clerk for userId:",
        userId
      );
      return res.status(400).json({
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
      isUserBuild: true, // This is for user-saved custom builds
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

// --- Admin Product Routes ---
app.post(
  "/api/admin/products",
  requireAuth(),
  requireAdmin,
  async (req, res) => {
    try {
      const productData = req.body;

      // Generate a unique ID for the new product
      const newProductId = `product-${Date.now()}`;

      // Create a new Product instance with the received data
      const newProduct = new Product({
        id: newProductId, // Assign the generated ID
        ...productData, // Spread the rest of the data from the request body
      });

      // Save the new product to the database
      const savedProduct = await newProduct.save();

      res.status(201).json({
        message: "Product created successfully!",
        product: savedProduct,
      });
    } catch (error) {
      console.error("Error creating product:", error);
      if (error.name === "ValidationError") {
        return res.status(400).json({ error: error.message });
      }
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
      const { id } = req.params; // Get the product ID from the URL parameters

      // Find the product by its 'id' field (or '_id' if that's what you use in your DB)
      const deletedProduct = await Product.findOneAndDelete({ id: id });

      if (!deletedProduct) {
        return res.status(404).json({ message: "Product not found." });
      }

      res
        .status(200)
        .json({ message: "Product deleted successfully.", deletedProduct });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product." });
    }
  }
);

// --- Admin Prebuilt PC Routes ---
app.post(
  "/api/admin/prebuilts",
  requireAuth(),
  requireAdmin,
  async (req, res) => {
    try {
      const auth = req.auth(); // Get auth object
      const userId = auth.userId; // Get userId of the admin creating the prebuilt

      const prebuiltData = req.body;

      // Generate a unique ID for the new prebuilt PC
      const newPrebuiltId = `prebuilt-${Date.now()}`;

      // Create a new Prebuilt instance with the received data
      const newPrebuilt = new Prebuilt({
        id: newPrebuiltId, // Assign the generated ID
        ...prebuiltData, // Spread the rest of the data from the request body
        createdBy: userId,
        isOfficial: true, // <--- ADDED: Mark as official
        isUserBuild: false, // <--- ADDED: Explicitly mark as NOT a user build
      });

      // Save the new prebuilt to the database
      const savedPrebuilt = await newPrebuilt.save();

      res.status(201).json({
        message: "Prebuilt PC created successfully!",
        prebuilt: savedPrebuilt,
      });
    } catch (error) {
      console.error("Error creating prebuilt PC:", error);
      if (error.name === "ValidationError") {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to create prebuilt PC." });
    }
  }
);

app.put(
  "/api/admin/prebuilts/:id",
  requireAuth(),
  requireAdmin,
  async (req, res) => {
    try {
      // Implement logic to update an existing prebuilt PC
      res.status(200).json({ message: "Prebuilt PC updated successfully." });
    } catch (error) {
      console.error("Error updating prebuilt PC:", error);
      res.status(500).json({ error: "Failed to update prebuilt PC." });
    }
  }
);

app.delete(
  "/api/admin/prebuilts/:id",
  requireAuth(),
  requireAdmin,
  async (req, res) => {
    try {
      // Implement logic to delete a prebuilt PC
      res.status(200).json({ message: "Prebuilt PC deleted successfully." });
    } catch (error) {
      console.error("Error deleting prebuilt PC:", error);
      res.status(500).json({ error: "Failed to delete prebuilt PC." });
    }
  }
);

// --- User Build Deletion (existing route, but note it's for user's own builds) ---
app.delete("/api/builds/:id", requireAuth(), async (req, res) => {
  try {
    const auth = req.auth(); // Get auth object
    const userId = auth.userId; // Get userId

    const buildId = req.params.id;

    const build = await Prebuilt.findById(buildId);
    // Allow deletion only if the user created it OR if the user is an admin
    // For admin deletion, you'd typically have a separate admin-specific delete route
    // This route is for users deleting their *own* builds.
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

// --- Admin User Management Routes (NEW) ---
// Note: We are not building frontend UI for this in this session,
// but the backend routes are present.
app.get("/api/admin/users", requireAuth(), requireAdmin, async (req, res) => {
  try {
    // Fetch users from Clerk. Clerk's API is the source of truth for user data.
    const users = await clerkClient.users.getUserList();

    // You might want to filter or transform the user data before sending it to the frontend
    const simplifiedUsers = users.map((user) => ({
      id: user.id,
      email: user.emailAddresses?.[0]?.emailAddress || "N/A",
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
      // Add more fields as needed, e.g., publicMetadata for roles
      role: user.publicMetadata?.role || "user", // Assuming 'role' is stored in publicMetadata
    }));

    res.status(200).json({ data: simplifiedUsers });
  } catch (error) {
    console.error("Error fetching users for admin dashboard:", error);
    res.status(500).json({ message: "Failed to fetch user data." });
  }
});

app.put(
  "/api/admin/users/:userId",
  requireAuth(),
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body; // Example: assuming you want to update the role

      // Update user metadata in Clerk
      const updatedUser = await clerkClient.users.updateUser(userId, {
        publicMetadata: { role: role }, // Update the role in publicMetadata
      });

      // You might also want to update your local User model if it mirrors Clerk data
      // await User.findOneAndUpdate({ clerkId: userId }, { role: role }, { new: true });

      res
        .status(200)
        .json({ message: "User updated successfully.", user: updatedUser });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user." });
    }
  }
);

app.delete(
  "/api/admin/users/:userId",
  requireAuth(),
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Delete user from Clerk
      await clerkClient.users.deleteUser(userId);

      // You might also want to delete the user from your local User model if it exists
      // await User.deleteOne({ clerkId: userId });

      res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user." });
    }
  }
);

export default app;

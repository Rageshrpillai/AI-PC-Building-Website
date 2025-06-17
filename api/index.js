import express from "express";
import dbConnect from "./lib/dbConnect.js";
import Product from "./models/Product.js";
import Prebuilt from "./models/Prebuilt.js";

const app = express();

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
app.post("/api/products/batch", async (req, res) => {
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
app.get("/api/builds/:buildId", async (req, res) => {
  try {
    const { buildId } = req.params;
    const prebuilt = await Prebuilt.findOne({ id: buildId });
    if (!prebuilt) {
      return res.status(404).json({ message: "Prebuilt PC not found" });
    }
    const partIds = prebuilt.parts.map((part) => part.id);
    const resolvedParts = await Product.find({ id: { $in: partIds } });
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

// --- Export for Vercel's serverless environment ---
export default app;

import express from "express";
import { getPublishedBlogs, getBlogBySlug } from "../controllers/blogController.js";

const router = express.Router();

// Public routes for blog lookup
router.get("/blogs", getPublishedBlogs);
router.get("/blogs/:slug", getBlogBySlug);

export default router;

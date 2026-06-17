import Product from "../models/Product.js";

/**
 * @desc    Get all products
 * @route   GET /api/v1/products
 * @access  Public
 */
export const getProducts = async (req, res, next) => {
  try {
    const { category, admin } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }

    // Return only available products for public requests (those without authentication)
    const hasAuth = req.headers.authorization && req.headers.authorization.startsWith("Bearer");
    if (!hasAuth && admin !== "true") {
      query.isAvailable = { $ne: false };
    }

    const products = await Product.find(query).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product
 * @route   GET /api/v1/products/:id
 * @access  Public
 */
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new product
 * @route   POST /api/v1/products
 * @access  Private (Admin)
 */
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      price,
      originalPrice,
      image,
      category,
      alt,
      ingredients,
      benefits,
      usage,
      faqs,
      testimonials,
      description,
      inStock,
      isFeatured,
      isAvailable,
    } = req.body;

    const product = await Product.create({
      name,
      price,
      originalPrice,
      image,
      category,
      alt,
      ingredients: ingredients || [],
      benefits: benefits || [],
      usage,
      faqs: faqs || [],
      testimonials: testimonials || [],
      description: description || "Premium healthcare wellness formula crafted with natural ingredients.",
      inStock: inStock !== undefined ? inStock : true,
      isFeatured: isFeatured !== undefined ? isFeatured : false,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a product
 * @route   PUT /api/v1/products/:id
 * @access  Private (Admin)
 */
// Fields a client is permitted to update on a product. Anything else in the
// request body (e.g. _id, __v, injected operator keys) is ignored.
const PRODUCT_UPDATABLE_FIELDS = [
  "name",
  "price",
  "originalPrice",
  "image",
  "category",
  "alt",
  "ingredients",
  "benefits",
  "usage",
  "faqs",
  "testimonials",
  "description",
  "inStock",
  "isFeatured",
  "isAvailable",
];

export const updateProduct = async (req, res, next) => {
  try {
    const updates = {};
    for (const field of PRODUCT_UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/v1/products/:id
 * @access  Private (Admin)
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

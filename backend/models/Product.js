import mongoose from "mongoose";

const faqSchema = new mongoose.Schema({
  q: { type: String, required: true },
  a: { type: String, required: true },
});

const testimonialSchema = new mongoose.Schema({
  author: { type: String, required: true },
  text: { type: String, required: true },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a product name"],
      trim: true,
      unique: true,
    },
    price: {
      type: Number,
      required: [true, "Please add a product price"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: {
      type: Number,
      required: [true, "Please add original price"],
      min: [0, "Original price cannot be negative"],
    },
    image: {
      type: String,
      required: [true, "Please add a product image URL"],
    },
    category: {
      type: String,
      required: [true, "Please select a product category"],
      enum: ["Supplements", "Tonics & Syrups", "Wellness Oils"],
    },
    alt: {
      type: String,
      required: [true, "Please add image alt description"],
      trim: true,
    },
    ingredients: {
      type: [String],
      default: [],
    },
    benefits: {
      type: [String],
      default: [],
    },
    usage: {
      type: String,
      required: [true, "Please add usage guidelines"],
    },
    faqs: [faqSchema],
    testimonials: [testimonialSchema],
    description: {
      type: String,
      required: [true, "Please add a description"],
      trim: true,
      default: "Premium healthcare wellness formula crafted with natural ingredients.",
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Public catalog: available products by category, newest first
productSchema.index({ isAvailable: 1, category: 1, createdAt: -1 });

const Product = mongoose.model("Product", productSchema);

export default Product;

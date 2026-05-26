import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a blog title"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    snippet: {
      type: String,
      required: [true, "Please add a short snippet/summary"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Please add the blog content body"],
    },
    image: {
      type: String,
      required: [true, "Please provide a featured image URL or Base64 upload string"],
    },
    category: {
      type: String,
      required: [true, "Please specify a blog category"],
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    seoTitle: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },
    readingTime: {
      type: Number,
      default: 1,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate slug and calculate reading time
blogSchema.pre("save", function (next) {
  // 1. Auto-generate slug from title if not set
  if (this.isModified("title") || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  // 2. Auto-calculate reading time (approx. 200 words per minute)
  if (this.isModified("content")) {
    const wordsCount = this.content.trim().split(/\s+/).length;
    this.readingTime = Math.max(1, Math.ceil(wordsCount / 200));
  }

  // 3. Set publishedAt date when isPublished changes to true
  if (this.isModified("isPublished")) {
    if (this.isPublished) {
      this.publishedAt = this.publishedAt || new Date();
    } else {
      this.publishedAt = undefined;
    }
  }

  next();
});

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;

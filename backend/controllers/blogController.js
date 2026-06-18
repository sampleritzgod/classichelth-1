import Blog from "../models/Blog.js";

/**
 * @desc    Get all published blogs (Public)
 * @route   GET /api/v1/blogs
 * @access  Public
 */
export const getPublishedBlogs = async (req, res, next) => {
  try {
    const { category } = req.query;
    const query = { isPublished: true };

    if (category && category !== "All") {
      query.category = category;
    }

    // List view doesn't need the full article body; exclude it to cut payload.
    const blogs = await Blog.find(query)
      .select("-content")
      .sort({ publishedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single published blog by slug (Public)
 * @route   GET /api/v1/blogs/:slug
 * @access  Public
 */
export const getBlogBySlug = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true }).lean();

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all blogs (Admin - including drafts)
 * @route   GET /api/v1/admin/blogs
 * @access  Private (Admin)
 */
export const getAdminBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find().select("-content").sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single blog by ID (Admin)
 * @route   GET /api/v1/admin/blogs/:id
 * @access  Private (Admin)
 */
export const getAdminBlogById = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a blog post (Admin)
 * @route   POST /api/v1/admin/blogs
 * @access  Private (Admin)
 */
export const createBlog = async (req, res, next) => {
  const caller = req.user ? `${req.user.email} (${req.user.role})` : "Unauthenticated";
  console.log(`[Blog Controller] Create blog request received from: ${caller}`);
  console.log(`[Blog Controller] Request Body Keys: ${Object.keys(req.body).join(", ")}`);

  try {
    const { title, snippet, content, image, category, isPublished, seoTitle, seoDescription } = req.body;

    console.log(`[Blog Controller] Incoming attributes: Title="${title}" Category="${category}" ImageURL="${image ? (image.length > 50 ? image.substring(0, 50) + "..." : image) : "None"}"`);

    if (!title || !snippet || !content || !image || !category) {
      console.warn(`[Blog Controller] Rejected: Missing required fields.`);
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields: title, snippet, content, image, category",
      });
    }

    console.log(`[Blog Controller] Persisting blog to database...`);
    const blog = await Blog.create({
      title,
      snippet,
      content,
      image,
      category,
      isPublished,
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || snippet,
    });

    console.log(`[Blog Controller] Blog post persisted successfully. ID: ${blog._id}, Slug: ${blog.slug}`);

    res.status(201).json({
      success: true,
      message: "Blog post created successfully",
      data: blog,
    });
  } catch (error) {
    console.error(`[Blog Controller] Blog creation failed: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Update a blog post (Admin)
 * @route   PUT /api/v1/admin/blogs/:id
 * @access  Private (Admin)
 */
export const updateBlog = async (req, res, next) => {
  try {
    const { title, snippet, content, image, category, isPublished, seoTitle, seoDescription, slug } = req.body;

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    // Update properties dynamically
    if (title !== undefined) blog.title = title;
    if (snippet !== undefined) blog.snippet = snippet;
    if (content !== undefined) blog.content = content;
    if (image !== undefined) blog.image = image;
    if (category !== undefined) blog.category = category;
    if (isPublished !== undefined) blog.isPublished = isPublished;
    if (seoTitle !== undefined) blog.seoTitle = seoTitle;
    if (seoDescription !== undefined) blog.seoDescription = seoDescription;
    if (slug !== undefined && slug.trim() !== "") blog.slug = slug;

    await blog.save();

    res.status(200).json({
      success: true,
      message: "Blog post updated successfully",
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a blog post (Admin)
 * @route   DELETE /api/v1/admin/blogs/:id
 * @access  Private (Admin)
 */
export const deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Blog post deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

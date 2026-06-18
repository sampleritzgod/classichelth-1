"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "@/config";

interface BlogFormProps {
  blogId?: string; // If provided, we are in Edit mode
}

export default function BlogForm({ blogId }: BlogFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [snippet, setSnippet] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState("Mindfulness");
  const [isPublished, setIsPublished] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [slug, setSlug] = useState("");

  const categories = ["Mindfulness", "Nutrition", "Lifestyle"];

  // Fetch blog data if in Edit mode
  useEffect(() => {
    if (!blogId) return;

    const fetchBlogData = async () => {
      try {
        setFetching(true);
        setError(null);

        const response = await fetch(`${API_ENDPOINTS.adminBlogs}/${blogId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load article from database.");
        }

        const json = await response.json();
        if (json.success) {
          const blog = json.data;
          setTitle(blog.title);
          setSnippet(blog.snippet);
          setContent(blog.content);
          setImage(blog.image);
          setCategory(blog.category);
          setIsPublished(blog.isPublished);
          setSeoTitle(blog.seoTitle || "");
          setSeoDescription(blog.seoDescription || "");
          setSlug(blog.slug || "");
        } else {
          throw new Error(json.message || "Failed to load blog data.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong while retrieving the blog data.");
      } finally {
        setFetching(false);
      }
    };

    fetchBlogData();
  }, [blogId]);

  // Handle local image file upload converting and uploading separately
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Frontend validation for image size (5MB limit)
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      setUploadError("Image file size exceeds the 5MB limit. Please choose a smaller image.");
      return;
    }

    // Reset states
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    const formData = new FormData();
    formData.append("image", file);

    const xhr = new XMLHttpRequest();
    
    // Enable sending cookies along with XMLHttpRequest
    xhr.withCredentials = true;
    
    // Configure upload endpoint
    const uploadUrl = API_ENDPOINTS.adminUpload || `${API_ENDPOINTS.adminBlogs.replace("/blogs", "/upload")}`;
    xhr.open("POST", uploadUrl, true);
    
    // Auth Header
    const token = localStorage.getItem("admin_token") || localStorage.getItem("token") || "";
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    // Track Progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
      }
    };

    // Request Completed
    xhr.onload = () => {
      setUploading(false);
      setUploadProgress(null);
      
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status === 200 && response.success) {
          setImage(response.imageUrl);
          setUploadError(null);
        } else {
          setUploadError(response.message || "Failed to upload image.");
        }
      } catch (err) {
        setUploadError("Error parsing server response.");
      }
    };

    // Error Handling
    xhr.onerror = () => {
      setUploading(false);
      setUploadProgress(null);
      setUploadError("Network error occurred during upload. Please check your connection.");
    };

    xhr.send(formData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !snippet.trim() || !content.trim() || !image.trim()) {
      setError("Please fill in all required fields (Title, Snippet, Image, Content).");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = blogId 
        ? `${API_ENDPOINTS.adminBlogs}/${blogId}`
        : API_ENDPOINTS.adminBlogs;
      const method = blogId ? "PUT" : "POST";

      const payload = {
        title: title.trim(),
        snippet: snippet.trim(),
        content: content.trim(),
        image: image.trim(),
        category,
        isPublished,
        seoTitle: seoTitle.trim() || title.trim(),
        seoDescription: seoDescription.trim() || snippet.trim(),
        slug: slug.trim() || undefined,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (response.ok && json.success) {
        router.push("/admin/blogs");
      } else {
        throw new Error(json.message || "Failed to save blog post.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while publishing the blog.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="text-center py-20 animate-pulse font-serif text-foreground/50">
        Loading article details from database...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-foreground/5 p-6 sm:p-8 shadow-xs">
      <h2 className="font-serif text-xl font-bold text-primary mb-6 border-b border-foreground/5 pb-4">
        {blogId ? "Edit Article Details" : "Create New Journal Entry"}
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-6 text-xs font-semibold leading-relaxed">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">Article Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="block w-full rounded-lg border border-foreground/15 bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
            placeholder="e.g. 5 Simple Restorative Morning Habits"
          />
        </div>

        {/* Form Row: Category & Slug */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Slug (Edit mode only) */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              URL Slug {blogId ? "(Editable)" : "(Auto-generated)"}
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={!blogId}
              placeholder="e.g. morning-habits-wellness"
              className="block w-full rounded-lg border border-foreground/15 bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* Snippet / Card Summary */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">Card Snippet / Summary *</label>
          <textarea
            required
            rows={2}
            value={snippet}
            onChange={(e) => setSnippet(e.target.value)}
            className="block w-full rounded-lg border border-foreground/15 bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none resize-y"
            placeholder="Brief introduction displayed on the blog list grid card..."
          />
        </div>

        {/* Featured Image */}
        <div className="space-y-4 border-t border-foreground/5 pt-4">
          <label className="block text-xs font-bold text-primary">Featured Image Configuration *</label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Upload File */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-1.5">
                Upload Image File (Max 5MB)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="block w-full text-xs text-foreground/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/15 file:cursor-pointer disabled:opacity-50"
              />
              
              {uploading && (
                <div className="w-full mt-3">
                  <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-primary">
                    <span>Uploading to server...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-foreground/10 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-150"
                      style={{ width: `${uploadProgress || 0}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {uploadError && (
                <p className="text-red-600 text-xs font-semibold mt-2 flex items-center gap-1">
                  <span>⚠️</span> {uploadError}
                </p>
              )}
            </div>

            {/* Manual URL */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-1.5">
                Or Input Image URL
              </label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="e.g. /images/blog_lifestyle.png"
                className="block w-full rounded-lg border border-foreground/15 bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Image Preview */}
          {image && (
            <div className="relative w-40 aspect-video rounded-xl overflow-hidden border border-foreground/5 bg-foreground/[0.02]">
              <img src={image} alt="Featured preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Content Body (Rich text markdown content) */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1">Article Content Body (HTML / Markdown format supported) *</label>
          <span className="text-[10px] text-foreground/40 block mb-1.5">
            Use standard HTML tags like &lt;p&gt;, &lt;h3&gt;, &lt;strong&gt;, and &lt;ul&gt; for text formatting.
          </span>
          <textarea
            required
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="block w-full rounded-lg border border-foreground/15 bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none font-mono resize-y"
            placeholder="<h3>Morning Stretch Routines</h3><p>Begin by drinking a warm cup of herbal water...</p>"
          />
        </div>

        {/* SEO Configuration */}
        <div className="border-t border-foreground/5 pt-4 space-y-4">
          <label className="block text-xs font-bold text-primary">SEO Settings (Optional)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* SEO Title */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-1.5">SEO Title Tag</label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Defaults to article title"
                className="block w-full rounded-lg border border-foreground/15 bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {/* SEO Description */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-1.5">SEO Meta Description</label>
              <input
                type="text"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Defaults to article snippet"
                className="block w-full rounded-lg border border-foreground/15 bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Publish Toggle Status */}
        <div className="flex items-center gap-x-3 border-t border-foreground/5 pt-4">
          <input
            type="checkbox"
            id="isPublished"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4.5 w-4.5 rounded border-foreground/15 text-primary focus:ring-primary cursor-pointer"
          />
          <label htmlFor="isPublished" className="text-xs font-bold text-foreground cursor-pointer select-none">
            Publish Immediately (Making it visible on the public website)
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-x-3 justify-end border-t border-foreground/5 pt-6">
          <button
            type="button"
            onClick={() => router.push("/admin/blogs")}
            className="px-6 py-2.5 border border-foreground/15 rounded-full text-xs font-semibold text-foreground/80 hover:bg-foreground/5 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="px-6 py-2.5 bg-primary text-white rounded-full text-xs font-semibold hover:bg-primary-hover cursor-pointer disabled:opacity-50 shadow-md shadow-primary/10"
          >
            {loading ? "Saving article..." : "Save Entry"}
          </button>
        </div>
      </form>
    </div>
  );
}

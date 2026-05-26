import React from "react";
import BlogForm from "../BlogForm";

export default function NewBlogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight font-serif text-foreground">
          New Blog Post
        </h1>
        <p className="text-xs text-foreground/50 mt-1">
          Compose and configure a new article to add to the public insights catalog.
        </p>
      </div>

      <BlogForm />
    </div>
  );
}

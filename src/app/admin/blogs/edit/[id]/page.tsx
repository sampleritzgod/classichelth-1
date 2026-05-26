"use client";

import React, { use } from "react";
import BlogForm from "../../BlogForm";

export default function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight font-serif text-foreground">
          Edit Blog Post
        </h1>
        <p className="text-xs text-foreground/50 mt-1">
          Modify the article content, category, featured image, or SEO configuration.
        </p>
      </div>

      <BlogForm blogId={id} />
    </div>
  );
}

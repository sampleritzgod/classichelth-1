"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";

export interface BlogItem {
  _id: string;
  title: string;
  slug: string;
  snippet: string;
  image: string;
  category: string;
  readingTime: number;
  publishedAt: string;
}

const CATEGORIES = ["All", "Mindfulness", "Nutrition", "Lifestyle"];

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export default function BlogListClient({ initialBlogs }: { initialBlogs: BlogItem[] }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const filteredBlogs = useMemo(() => {
    const term = search.toLowerCase();
    return initialBlogs.filter((blog) => {
      const matchesCategory = categoryFilter === "All" || blog.category === categoryFilter;
      const matchesSearch =
        blog.title.toLowerCase().includes(term) ||
        blog.snippet.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [initialBlogs, search, categoryFilter]);

  return (
    <>
      {/* Filters & Search Grid */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-12 border-b border-foreground/5 pb-8">
        <div className="w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search articles by title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-foreground/15 bg-background px-4 py-3 text-sm text-foreground shadow-xs focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
          />
        </div>

        <div className="flex gap-x-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border shrink-0 ${
                categoryFilter === cat
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "bg-background text-foreground/70 border-foreground/10 hover:bg-foreground/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredBlogs.length === 0 ? (
        <div className="text-center py-20 bg-accent-soft/10 rounded-3xl border border-dashed border-foreground/10">
          <p className="text-sm text-foreground/60 font-medium font-serif">
            No journal entries match your search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-8 lg:gap-x-12">
          {filteredBlogs.map((blog) => (
            <article key={blog._id} className="flex flex-col group animate-fade-up">
              <Link
                href={`/blog/${blog.slug}`}
                className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 border border-foreground/5 shadow-sm block hover:shadow-md transition-all"
              >
                <SafeImage
                  src={blog.image}
                  alt={blog.title}
                  fill
                  className="object-cover transition-transform duration-750 group-hover:scale-103"
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </Link>

              <div className="flex items-center gap-x-2.5 text-[10px] font-bold text-primary uppercase tracking-wider mb-2.5">
                <span>{blog.category}</span>
                <span className="h-1 w-1 rounded-full bg-foreground/30" />
                <span className="text-foreground/50 font-medium font-mono">{blog.readingTime} min read</span>
                <span className="h-1 w-1 rounded-full bg-foreground/30" />
                <span className="text-foreground/50 font-medium">{formatDate(blog.publishedAt)}</span>
              </div>

              <Link href={`/blog/${blog.slug}`}>
                <h3 className="text-xl font-medium font-serif text-foreground mb-3 group-hover:text-primary transition-colors">
                  {blog.title}
                </h3>
              </Link>
              <p className="text-sm text-foreground/80 leading-relaxed mb-4 flex-grow line-clamp-3">
                {blog.snippet}
              </p>
              <Link
                href={`/blog/${blog.slug}`}
                className="text-sm font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-x-1 self-start group-hover:translate-x-1 transition-transform"
              >
                Read Article
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

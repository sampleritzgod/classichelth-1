"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { API_ENDPOINTS } from "@/config";

interface BlogItem {
  _id: string;
  title: string;
  slug: string;
  snippet: string;
  image: string;
  category: string;
  readingTime: number;
  publishedAt: string;
}

const IMAGE_FALLBACK = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23faf9f5"/><text x="50" y="50" font-family="serif" font-size="8" fill="%238a9a86" text-anchor="middle" dominant-baseline="middle">Classic Health</text></svg>';

interface SafeImageProps extends Omit<React.ComponentProps<typeof Image>, "src"> {
  src: string;
}

function SafeImage({ src, alt, ...props }: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  
  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Image
      {...props}
      src={imgSrc || IMAGE_FALLBACK}
      alt={alt || "Blog image"}
      onError={() => {
        setImgSrc(IMAGE_FALLBACK);
      }}
    />
  );
}

export default function BlogListPage() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const categories = ["All", "Mindfulness", "Nutrition", "Lifestyle"];

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = API_ENDPOINTS.blogs;
      if (categoryFilter !== "All") {
        url += `?category=${encodeURIComponent(categoryFilter)}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to load insights.");
      }

      const json = await response.json();
      if (json.success) {
        setBlogs(json.data);
      } else {
        throw new Error(json.message || "Failed to fetch blogs");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while retrieving the blog catalog.");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  useEffect(() => {
    document.title = "Journal & Insights | Classic Health";
  }, []);

  // Client-side search filtering
  const filteredBlogs = blogs.filter((blog) =>
    blog.title.toLowerCase().includes(search.toLowerCase()) ||
    blog.snippet.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <>
      <Navbar />
      
      <main className="flex-grow bg-background py-16 sm:py-20 lg:py-24 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          
          {/* Header */}
          <div className="max-w-3xl mb-12 animate-fade-up">
            <span className="text-xs font-bold tracking-widest text-primary uppercase mb-4 inline-block px-3 py-1 rounded-full bg-primary/5">
              Insights & Journal
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl font-serif mb-6 leading-tight">
              Simple Wellness Wisdom
            </h1>
            <p className="text-base text-foreground/80 leading-relaxed">
              Explore our library of holistic guidelines, clinical notes, and daily lifestyle practices compiled by our professional therapeutic team to help you navigate metabolic wellness and inner calm.
            </p>
          </div>

          {/* Filters & Search Grid */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-12 border-b border-foreground/5 pb-8">
            {/* Search Input */}
            <div className="w-full sm:max-w-md">
              <input
                type="text"
                placeholder="Search articles by title or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full rounded-lg border border-foreground/15 bg-background px-4 py-3 text-sm text-foreground shadow-xs focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-x-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
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

          {/* Main List */}
          {loading ? (
            /* Skeletons */
            <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-8 lg:gap-x-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col animate-pulse">
                  <div className="relative w-full aspect-[4/3] rounded-2xl bg-foreground/10 mb-6" />
                  <div className="h-6 w-3/4 bg-foreground/10 rounded mb-3" />
                  <div className="h-4 w-full bg-foreground/5 rounded mb-2" />
                  <div className="h-4 w-5/6 bg-foreground/5 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-red-50/50 border border-dashed border-red-200 rounded-3xl">
              <p className="text-sm text-red-600 font-semibold mb-2">Error: {error}</p>
              <button 
                onClick={fetchBlogs}
                className="text-xs font-semibold text-primary underline hover:text-primary-hover"
              >
                Try reloading insights
              </button>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="text-center py-20 bg-accent-soft/10 rounded-3xl border border-dashed border-foreground/10">
              <p className="text-sm text-foreground/60 font-medium font-serif">No journal entries match your search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-8 lg:gap-x-12">
              {filteredBlogs.map((blog) => (
                <article key={blog._id} className="flex flex-col group animate-fade-up">
                  {/* Blog Image */}
                  <Link href={`/blog/${blog.slug}`} className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 border border-foreground/5 shadow-sm block hover:shadow-md transition-all">
                    <SafeImage
                      src={blog.image}
                      alt={blog.title}
                      fill
                      className="object-cover transition-transform duration-750 group-hover:scale-103"
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </Link>

                  {/* Blog Meta */}
                  <div className="flex items-center gap-x-2.5 text-[10px] font-bold text-primary uppercase tracking-wider mb-2.5">
                    <span>{blog.category}</span>
                    <span className="h-1 w-1 rounded-full bg-foreground/30" />
                    <span className="text-foreground/50 font-medium font-mono">{blog.readingTime} min read</span>
                    <span className="h-1 w-1 rounded-full bg-foreground/30" />
                    <span className="text-foreground/50 font-medium">{formatDate(blog.publishedAt)}</span>
                  </div>

                  {/* Blog Title & Content */}
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
          
        </div>
      </main>

      <Footer />
    </>
  );
}

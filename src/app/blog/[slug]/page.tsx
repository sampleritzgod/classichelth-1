"use client";

import React, { useEffect, useState, useCallback, use } from "react";
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
  content: string;
  image: string;
  category: string;
  readingTime: number;
  seoTitle?: string;
  seoDescription?: string;
  publishedAt: string;
}

import { resolveImageUrl, IMAGE_FALLBACK } from "@/utils/image";

interface SafeImageProps extends Omit<React.ComponentProps<typeof Image>, "src"> {
  src: string;
}

function SafeImage({ src, alt, ...props }: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(resolveImageUrl(src));
  
  useEffect(() => {
    setImgSrc(resolveImageUrl(src));
  }, [src]);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt || "Blog post image"}
      onError={() => {
        setImgSrc(IMAGE_FALLBACK);
      }}
    />
  );
}

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlog = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_ENDPOINTS.blogs}/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("This article could not be found or is no longer active.");
        }
        throw new Error("Failed to load article details.");
      }

      const json = await response.json();
      if (json.success) {
        setBlog(json.data);
      } else {
        throw new Error(json.message || "Failed to parse article details");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while loading the article.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchBlog();
  }, [fetchBlog]);

  // Update client document tab title dynamically
  useEffect(() => {
    if (blog) {
      document.title = blog.seoTitle || `${blog.title} | Serene Journal`;
    }
  }, [blog]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex-grow bg-background py-16 sm:py-20 lg:py-24 animate-pulse">
          <div className="mx-auto max-w-3xl px-6 lg:px-8 space-y-6">
            <div className="h-4 w-32 bg-foreground/10 rounded" />
            <div className="h-10 w-full bg-foreground/10 rounded" />
            <div className="h-6 w-5/6 bg-foreground/5 rounded" />
            <div className="relative w-full aspect-[16/9] rounded-3xl bg-foreground/10 mt-8" />
            <div className="space-y-4 mt-8">
              <div className="h-4 w-full bg-foreground/5 rounded" />
              <div className="h-4 w-full bg-foreground/5 rounded" />
              <div className="h-4 w-4/5 bg-foreground/5 rounded" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !blog) {
    return (
      <>
        <Navbar />
        <main className="flex-grow bg-background py-16 sm:py-20 lg:py-24 text-center">
          <div className="mx-auto max-w-3xl px-6 lg:px-8 py-20">
            <span className="text-4xl block mb-4">📖</span>
            <h2 className="font-serif text-2xl text-foreground font-semibold mb-2">Article Offline</h2>
            <p className="text-sm text-foreground/60 max-w-md mx-auto mb-8">{error}</p>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-white hover:bg-primary-hover transition-all shadow-md shadow-primary/10"
            >
              Back to Journal
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      
      <main className="flex-grow bg-background py-16 sm:py-20 lg:py-24 scroll-mt-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          {/* Back Button */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-x-1.5 text-xs font-semibold text-primary hover:text-primary-hover mb-8 group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform" aria-hidden="true">&larr;</span>
            Back to Journal
          </Link>

          {/* Article Header */}
          <header className="mb-10">
            <div className="flex items-center gap-x-2.5 text-[10px] font-bold text-primary uppercase tracking-wider mb-4">
              <span>{blog.category}</span>
              <span className="h-1 w-1 rounded-full bg-foreground/30" />
              <span className="text-foreground/50 font-medium font-mono">{blog.readingTime} min read</span>
              <span className="h-1 w-1 rounded-full bg-foreground/30" />
              <span className="text-foreground/50 font-medium">{formatDate(blog.publishedAt)}</span>
            </div>

            <h1 className="text-3xl font-normal tracking-tight text-foreground sm:text-4xl lg:text-5xl font-serif mb-6 leading-tight">
              {blog.title}
            </h1>

            <p className="text-base sm:text-lg text-foreground/80 leading-relaxed font-medium italic border-l-2 border-primary/25 pl-4 py-1">
              {blog.snippet}
            </p>
          </header>

          {/* Featured Image */}
          <div className="relative w-full aspect-[16/9] rounded-[2rem] overflow-hidden mb-12 border border-foreground/5 shadow-md">
            <SafeImage
              src={blog.image}
              alt={blog.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 768px"
            />
          </div>

          {/* Article Rich Text Body */}
          <article className="prose max-w-none text-foreground/90 leading-relaxed text-sm sm:text-base space-y-6">
            <div 
              className="whitespace-pre-wrap font-serif"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </article>
        </div>
      </main>

      <Footer />
    </>
  );
}

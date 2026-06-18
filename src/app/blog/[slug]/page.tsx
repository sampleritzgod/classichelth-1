import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SafeImage from "@/components/SafeImage";
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

// Disable static caching for blog posts to ensure updates/new posts are visible immediately
export const revalidate = 0;

async function getBlog(slug: string): Promise<BlogItem | null> {
  try {
    const res = await fetch(`${API_ENDPOINTS.blogs}/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog) {
    return { title: "Article Not Found | Classic Health" };
  }
  return {
    title: blog.seoTitle || `${blog.title} | Classic Health Journal`,
    description: blog.seoDescription || blog.snippet,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) {
    notFound();
  }

  return (
    <>
      <Navbar />

      <main className="flex-grow bg-background py-16 sm:py-20 lg:py-24 scroll-mt-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-x-1.5 text-xs font-semibold text-primary hover:text-primary-hover mb-8 group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform" aria-hidden="true">
              &larr;
            </span>
            Back to Journal
          </Link>

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

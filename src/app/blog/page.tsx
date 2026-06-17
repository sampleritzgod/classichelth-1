import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { API_ENDPOINTS } from "@/config";
import BlogListClient, { type BlogItem } from "./BlogListClient";

export const metadata: Metadata = {
  title: "Journal & Insights | Classic Health",
  description:
    "Explore holistic guidelines, clinical notes, and daily lifestyle practices from our therapeutic team.",
};

// Revalidate the published blog list every hour (ISR).
export const revalidate = 3600;

async function getBlogs(): Promise<BlogItem[]> {
  try {
    const res = await fetch(API_ENDPOINTS.blogs, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch {
    return [];
  }
}

export default async function BlogListPage() {
  const blogs = await getBlogs();

  return (
    <>
      <Navbar />

      <main className="flex-grow bg-background py-16 sm:py-20 lg:py-24 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-3xl mb-12 animate-fade-up">
            <span className="text-xs font-bold tracking-widest text-primary uppercase mb-4 inline-block px-3 py-1 rounded-full bg-primary/5">
              Insights & Journal
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl font-serif mb-6 leading-tight">
              Simple Wellness Wisdom
            </h1>
            <p className="text-base text-foreground/80 leading-relaxed">
              Explore our library of holistic guidelines, clinical notes, and daily lifestyle
              practices compiled by our professional therapeutic team to help you navigate metabolic
              wellness and inner calm.
            </p>
          </div>

          <BlogListClient initialBlogs={blogs} />
        </div>
      </main>

      <Footer />
    </>
  );
}

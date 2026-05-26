import { MetadataRoute } from "next";
import { API_ENDPOINTS } from "@/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://your-first-creation.vercel.app";

  // Base paths
  const routes = ["", "/blog", "/profile"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Fetch blogs to build dynamic sitemap entries
  try {
    const res = await fetch(API_ENDPOINTS.blogs, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const blogUrls = json.data.map((blog: any) => ({
          url: `${baseUrl}/blog/${blog.slug}`,
          lastModified: new Date(blog.updatedAt || blog.publishedAt || Date.now()),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }));
        return [...routes, ...blogUrls];
      }
    }
  } catch (error) {
    console.error("Failed to compile dynamic sitemap entries:", error);
  }

  return routes;
}

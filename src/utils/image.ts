import { API_URL } from "@/config";

export const IMAGE_FALLBACK = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23faf9f5"/><text x="50" y="50" font-family="serif" font-size="8" fill="%238a9a86" text-anchor="middle" dominant-baseline="middle">Classic Health</text></svg>';

/**
 * Resolves a dynamic image path/URL to its absolute address.
 * - Returns a data SVG fallback if the path is empty/undefined.
 * - Returns the path directly if it is already an absolute URL or Base64 data URL.
 * - Returns the path directly if it is a local frontend asset (starts with "/images/").
 * - Otherwise, prepends the backend API URL (API_URL) to resolve static files from the backend server.
 */
export const resolveImageUrl = (path?: string): string => {
  if (!path) return IMAGE_FALLBACK;
  
  const trimmed = path.trim();
  
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  
  // Local frontend assets (placed inside the Next.js `public/images` directory)
  if (trimmed.startsWith("/images/")) {
    return trimmed;
  }
  
  // Prepend API_URL to relative backend paths (like "/uploads/product-...")
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  
  // Strip trailing slash from API_URL if present, and combine
  const baseUrl = API_URL.replace(/\/$/, "");
  return `${baseUrl}${cleanPath}`;
};

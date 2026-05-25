/**
 * Application Configuration
 */

// Resolved backend API URL
// In production, Vercel will inject process.env.NEXT_PUBLIC_API_URL.
// In local development, it will fall back to localhost:5005.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://u-1st-creation.onrender.com";

// API endpoints
export const API_ENDPOINTS = {
  health: `${API_URL}/api/v1/health`,
  appointments: `${API_URL}/api/v1/appointments`,
};

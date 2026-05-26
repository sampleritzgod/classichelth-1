/**
 * Application Configuration
 */

// Resolved backend API URL
// In production, Vercel will inject process.env.NEXT_PUBLIC_API_URL.
// In local development, it will fall back to localhost:5005.
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (isLocalhost ? "http://localhost:5005" : "https://u-1st-creation.onrender.com");

// API endpoints
export const API_ENDPOINTS = {
  health: `${API_URL}/api/v1/health`,
  appointments: `${API_URL}/api/v1/appointments`,
  products: `${API_URL}/api/v1/products`,
  messages: `${API_URL}/api/v1/messages`,
  blogs: `${API_URL}/api/v1/blogs`,
  adminBlogs: `${API_URL}/api/v1/admin/blogs`,
  adminStats: `${API_URL}/api/v1/admin/dashboard/stats`,
  adminAppointments: `${API_URL}/api/v1/admin/appointments`,
  adminMessages: `${API_URL}/api/v1/admin/messages`,
  adminProducts: `${API_URL}/api/v1/products`,
  signup: `${API_URL}/api/v1/auth/signup`,
  login: `${API_URL}/api/v1/auth/login`,
  logout: `${API_URL}/api/v1/auth/logout`,
  authMe: `${API_URL}/api/v1/auth/me`,
  forgotPassword: `${API_URL}/api/v1/auth/forgot-password`,
  resetPassword: `${API_URL}/api/v1/auth/reset-password`,
  googleLogin: `${API_URL}/api/v1/auth/google`,
  facebookLogin: `${API_URL}/api/v1/auth/facebook`,
};


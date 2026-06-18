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
  products: `${API_URL}/api/v1/products`,
  messages: `${API_URL}/api/v1/messages`,
  blogs: `${API_URL}/api/v1/blogs`,
  adminBlogs: `${API_URL}/api/v1/admin/blogs`,
  adminUpload: `${API_URL}/api/v1/admin/upload`,
  adminStats: `${API_URL}/api/v1/admin/dashboard/stats`,
  adminAppointments: `${API_URL}/api/v1/admin/appointments`,
  adminMessages: `${API_URL}/api/v1/admin/messages`,
  adminCapacity: `${API_URL}/api/v1/admin/capacity`,
  adminProducts: `${API_URL}/api/v1/products`,
  signup: `${API_URL}/api/v1/auth/signup`,
  login: `${API_URL}/api/v1/auth/login`,
  google: `${API_URL}/api/v1/auth/google`,
  logout: `${API_URL}/api/v1/auth/logout`,
  authMe: `${API_URL}/api/v1/auth/me`,
  profile: `${API_URL}/api/v1/auth/profile`,
  registerFcmToken: `${API_URL}/api/v1/auth/fcm-token`,
  createOrder: `${API_URL}/api/v1/payments/create-order`,
  verifyPayment: `${API_URL}/api/v1/payments/verify`,
  myAppointments: `${API_URL}/api/v1/appointments/my`,
  notifications: `${API_URL}/api/v1/notifications`,
  markAllNotificationsRead: `${API_URL}/api/v1/notifications/read-all`,
};


"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/config";

// Globally intercept fetch to ensure credentials: "include" is always set for API requests.
// This preserves the session cookie across refreshes and page transitions.
if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let url = "";
    if (typeof input === "string") {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else if (input && typeof input === "object" && "url" in input) {
      url = (input as any).url || "";
    }
    
    // Check if request is relative or targets our backend APIs
    const isApi = !url.startsWith("http") || url.includes("/api/") || url.includes("onrender.com") || url.includes("localhost");
    
    if (isApi) {
      const newInit = { ...init };
      newInit.credentials = "include";
      
      // Add Authorization header if token exists in localStorage and is not already provided
      const token = localStorage.getItem("token") || localStorage.getItem("admin_token");
      if (token) {
        if (!newInit.headers) {
          newInit.headers = {};
        }
        
        if (newInit.headers instanceof Headers) {
          if (!newInit.headers.has("Authorization")) {
            newInit.headers.set("Authorization", `Bearer ${token}`);
          }
        } else if (Array.isArray(newInit.headers)) {
          const hasAuth = newInit.headers.some(h => h[0].toLowerCase() === "authorization");
          if (!hasAuth) {
            newInit.headers.push(["Authorization", `Bearer ${token}`]);
          }
        } else {
          // It's a Record<string, string>
          const headersRecord = newInit.headers as Record<string, string>;
          const hasAuth = Object.keys(headersRecord).some(k => k.toLowerCase() === "authorization");
          if (!hasAuth) {
            headersRecord["Authorization"] = `Bearer ${token}`;
          }
        }
      }
      
      return originalFetch(input, newInit);
    }
    
    return originalFetch(input, init);
  };
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "superadmin";
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (name: string, email: string) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check user session on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("[AuthContext] Session check: Started fetching /api/v1/auth/me");
        const response = await fetch(API_ENDPOINTS.authMe, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const json = await response.json();
        console.log("[AuthContext] Session check response received:", json);

        if (response.ok && json.success && json?.data?.user) {
          const fetchedUser = json.data.user;
          console.log("[AuthContext] Active session verified. Logged in user email:", fetchedUser.email);
          setUser(fetchedUser);
          
          // Sync localStorage for admin route guards
          if (fetchedUser?.role === "admin" || fetchedUser?.role === "superadmin") {
            localStorage.setItem("admin_email", fetchedUser?.email || "");
            localStorage.setItem("admin_role", fetchedUser?.role || "");
          } else {
            localStorage.removeItem("admin_email");
            localStorage.removeItem("admin_role");
          }
        } else {
          console.log("[AuthContext] Session invalid or unauthenticated.");
          setUser(null);
          localStorage.removeItem("token");
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_email");
          localStorage.removeItem("admin_role");
        }
      } catch (error: any) {
        console.error("[AuthContext] Session restoration threw exception:", error);
        
        // Developer fallback in case server is offline
        const adminRole = localStorage.getItem("admin_role");
        const adminEmail = localStorage.getItem("admin_email");
        if (adminRole === "admin" || adminRole === "superadmin") {
          console.log("[AuthContext] Server offline. Using offline developer administrative session fallback.");
          setUser({
            _id: "000000000000000000000123",
            name: "Admin Tester (Offline)",
            email: adminEmail || "admin@example.com",
            role: adminRole as "admin" | "superadmin",
            createdAt: new Date().toISOString(),
          });
        } else {
          setUser(null);
          localStorage.removeItem("token");
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_email");
          localStorage.removeItem("admin_role");
        }
      } finally {
        console.log("[AuthContext] Session check complete. Setting loading to false.");
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Sync token to localStorage for existing admin routes when credentials are set
  const syncAdminSession = (data?: { user?: User; token?: string }) => {
    if (!data || !data.user) return;
    const user = data.user;
    setUser(user);
    if (data.token) {
      localStorage.setItem("token", data.token);
      if (user?.role === "admin" || user?.role === "superadmin") {
        localStorage.setItem("admin_token", data.token);
      }
    }
    if (user?.role === "admin" || user?.role === "superadmin") {
      localStorage.setItem("admin_email", user?.email || "");
      localStorage.setItem("admin_role", user?.role || "");
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    const response = await fetch(API_ENDPOINTS.login, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.message || "Failed to log in.");
    }

    syncAdminSession(json);
    return json.data.user;
  };

  const signup = async (name: string, email: string, password: string): Promise<User> => {
    const response = await fetch(API_ENDPOINTS.signup, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
      credentials: "include",
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.message || "Failed to sign up.");
    }

    syncAdminSession(json);
    return json.data.user;
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch(API_ENDPOINTS.logout, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_email");
      localStorage.removeItem("admin_role");
    }
  };

  const updateProfile = async (name: string, email: string): Promise<User> => {
    const response = await fetch(API_ENDPOINTS.profile, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email }),
      credentials: "include",
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.message || "Failed to update profile.");
    }

    const updatedUser = json?.data?.user;
    setUser(updatedUser);
    
    // Sync email to admin localStorage if role is admin
    if (updatedUser && (updatedUser?.role === "admin" || updatedUser?.role === "superadmin")) {
      localStorage.setItem("admin_email", updatedUser?.email || "");
    }

    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

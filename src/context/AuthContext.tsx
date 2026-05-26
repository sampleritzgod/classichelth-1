"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/config";

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
        const response = await fetch(API_ENDPOINTS.authMe, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // Always send cookies in fetch request
          credentials: "include",
        });

        const json = await response.json();

        if (response.ok && json.success && json?.data?.user) {
          const user = json.data.user;
          setUser(user);
          
          // For administrative route compatibility
          if (user?.role === "admin" || user?.role === "superadmin") {
            localStorage.setItem("admin_email", user?.email || "");
            localStorage.setItem("admin_role", user?.role || "");
            if (json.token) {
              localStorage.setItem("admin_token", json.token);
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Session restoration failed:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    // Only restore session if not in an environment where we mock local storage logins
    fetchUser();
  }, []);

  // Sync token to localStorage for existing admin routes when credentials are set
  const syncAdminSession = (data?: { user?: User; token?: string }) => {
    if (!data || !data.user) return;
    const user = data.user;
    setUser(user);
    if (user?.role === "admin" || user?.role === "superadmin") {
      localStorage.setItem("admin_email", user?.email || "");
      localStorage.setItem("admin_role", user?.role || "");
      if (data.token) {
        localStorage.setItem("admin_token", data.token);
      }
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

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/config";

interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  provider: "local" | "google" | "facebook";
  profileImage?: string;
  role: "user" | "admin" | "superadmin";
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (fullName: string, email: string, password: string, phone?: string) => Promise<User>;
  logout: () => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<User>;
  loginWithFacebook: (accessToken: string) => Promise<User>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<User>;
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

        if (response.ok && json.success) {
          setUser(json.data.user);
          
          // For administrative route compatibility
          if (json.data.user.role === "admin" || json.data.user.role === "superadmin") {
            localStorage.setItem("admin_email", json.data.user.email);
            localStorage.setItem("admin_role", json.data.user.role);
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

    fetchUser();
  }, []);

  // Sync token to localStorage for existing admin routes when credentials are set
  const syncAdminSession = (data: { user: User; token?: string }) => {
    setUser(data.user);
    if (data.user.role === "admin" || data.user.role === "superadmin") {
      localStorage.setItem("admin_email", data.user.email);
      localStorage.setItem("admin_role", data.user.role);
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

  const signup = async (fullName: string, email: string, password: string, phone?: string): Promise<User> => {
    const response = await fetch(API_ENDPOINTS.signup, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fullName, email, password, phone }),
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

  const loginWithGoogle = async (idToken: string): Promise<User> => {
    const response = await fetch(API_ENDPOINTS.googleLogin, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
      credentials: "include",
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.message || "Google authentication failed.");
    }

    syncAdminSession(json);
    return json.data.user;
  };

  const loginWithFacebook = async (accessToken: string): Promise<User> => {
    const response = await fetch(API_ENDPOINTS.facebookLogin, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accessToken }),
      credentials: "include",
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.message || "Facebook authentication failed.");
    }

    syncAdminSession(json);
    return json.data.user;
  };

  const forgotPassword = async (email: string): Promise<void> => {
    const response = await fetch(API_ENDPOINTS.forgotPassword, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.message || "Failed to send reset link.");
    }
  };

  const resetPassword = async (token: string, password: string): Promise<User> => {
    const response = await fetch(`${API_ENDPOINTS.resetPassword}/${token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
      credentials: "include",
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.message || "Failed to reset password.");
    }

    syncAdminSession(json);
    return json.data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        loginWithGoogle,
        loginWithFacebook,
        forgotPassword,
        resetPassword,
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

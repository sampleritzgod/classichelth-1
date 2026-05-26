"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "@/config";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect directly to dashboard
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      router.push("/admin/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API_ENDPOINTS.login, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const json = await response.json();

      if (response.ok && json.success) {
        localStorage.setItem("admin_token", json?.token || "");
        localStorage.setItem("admin_email", json?.data?.user?.email || "");
        localStorage.setItem("admin_role", json?.data?.user?.role || "");

        // Redirect to dashboard board
        router.push("/admin/dashboard");
      } else {
        throw new Error(json.message || "Invalid authentication credentials.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to log in. Please check your credentials or backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-foreground/5 shadow-xl space-y-8 animate-fade-up">
        {/* Brand Header */}
        <div className="text-center">
          <span className="h-3 w-3 rounded-full bg-[#4caf50] inline-block mr-1.5" />
          <span className="font-serif text-lg font-bold tracking-tight text-primary">
            U 1st Creation
          </span>
          <h2 className="mt-4 font-serif text-2xl font-bold tracking-tight text-foreground">
            Administrative Portal
          </h2>
          <p className="mt-1.5 text-xs text-foreground/50">
            Sign in with clinical credentials to manage the wellness site.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-xs font-semibold leading-relaxed text-center">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@u1stcreation.com"
              className="block w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 shadow-md shadow-primary/10 cursor-pointer"
          >
            {loading ? "Authenticating session..." : "Access Dashboard"}
          </button>
        </form>

        <div className="text-center pt-2">
          <a
            href="/"
            className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
          >
            ← Back to Clinic Homepage
          </a>
        </div>
      </div>
    </div>
  );
}

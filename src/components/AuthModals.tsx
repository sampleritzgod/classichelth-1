"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface AuthModalsProps {
  isOpen: boolean;
  initialMode?: "login" | "signup";
  onClose: () => void;
}

export default function AuthModals({ isOpen, initialMode = "login", onClose }: AuthModalsProps) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync mode with initialMode prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      // Clear inputs
      setName("");
      setEmail("");
      setPassword("");
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email.trim(), password);
        onClose();
      } else if (mode === "signup") {
        if (!name.trim() || !email.trim() || !password) {
          throw new Error("Please fill in all required fields.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        await signup(name.trim(), email.trim(), password);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Authentication request failed. Please check details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#122415]/40 backdrop-blur-md transition-opacity">
      {/* Backdrop overlay */}
      <div onClick={onClose} className="absolute inset-0 cursor-pointer" />

      {/* Modal Wrapper */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#faf9f5] p-8 border border-foreground/5 shadow-2xl animate-fade-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-foreground/50 hover:bg-foreground/5 hover:text-foreground transition-all duration-300 cursor-pointer"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="mb-6 text-center">
          <span className="h-2 w-2 rounded-full bg-accent-gold inline-block mr-2" />
          <span className="font-serif text-xs font-bold tracking-widest text-[#1e3f20] uppercase">
            Classic Health Wellness
          </span>
          <h3 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-foreground">
            {mode === "login" ? "Welcome Back" : "Create Health Account"}
          </h3>
          <p className="mt-1 text-xs text-foreground/60">
            {mode === "login" 
              ? "Access your personalized wellness profile and orders." 
              : "Sign up to book consultations and purchase remedies."}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs font-semibold leading-relaxed mb-4 text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-[10px] font-bold text-foreground/70 mb-1.5 uppercase tracking-wider">
                Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Sharma"
                className="block w-full rounded-xl border border-foreground/15 bg-background px-4 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-medium"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-foreground/70 mb-1.5 uppercase tracking-wider">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="block w-full rounded-xl border border-foreground/15 bg-background px-4 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-medium"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-bold text-foreground/70 uppercase tracking-wider">
                Password *
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full rounded-xl border border-foreground/15 bg-background px-4 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 disabled:opacity-50 shadow-md shadow-primary/10 cursor-pointer mt-2"
          >
            {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Modal Toggle Footer Links */}
        <div className="mt-6 text-center border-t border-foreground/5 pt-4">
          {mode === "login" ? (
            <p className="text-xs text-foreground/60">
              Don't have a wellness account?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-primary hover:underline font-bold cursor-pointer"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p className="text-xs text-foreground/60">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-primary hover:underline font-bold cursor-pointer"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

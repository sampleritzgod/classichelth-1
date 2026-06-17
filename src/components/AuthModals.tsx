"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface AuthModalsProps {
  isOpen: boolean;
  initialMode?: "login" | "signup";
  onClose: () => void;
}

export default function AuthModals({ isOpen, initialMode = "login", onClose }: AuthModalsProps) {
  const { login, signup, loginWithGoogle } = useAuth();
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

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      // Don't surface a scary error when the user simply closes the popup.
      const code = err?.code || "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return;
      }
      setError(err.message || "Google sign-in failed. Please try again.");
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
          aria-label="Close"
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

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-foreground/10" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">
            or
          </span>
          <div className="h-px flex-1 bg-foreground/10" />
        </div>

        {/* Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-foreground/[0.03] text-foreground py-3 px-4 rounded-xl text-xs font-semibold tracking-wide border border-foreground/15 transition-all duration-300 disabled:opacity-50 cursor-pointer"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading ? "Please wait..." : "Continue with Google"}
        </button>

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

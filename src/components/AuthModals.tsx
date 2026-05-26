"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface AuthModalsProps {
  isOpen: boolean;
  initialMode?: "login" | "signup" | "forgot";
  onClose: () => void;
}

export default function AuthModals({ isOpen, initialMode = "login", onClose }: AuthModalsProps) {
  const { login, signup, forgotPassword, loginWithGoogle, loginWithFacebook } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(initialMode);
  
  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  
  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync mode with initialMode prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessMessage(null);
      // Clear inputs
      setFullName("");
      setEmail("");
      setPassword("");
      setPhone("");
    }
  }, [isOpen, initialMode]);

  // Load SSO SDK scripts
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load Google GSI Script
    if (!document.getElementById("google-gsi-script")) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.id = "google-gsi-script";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    // Load Facebook SDK
    if (!document.getElementById("facebook-sdk-script")) {
      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.id = "facebook-sdk-script";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      (window as any).fbAsyncInit = function () {
        (window as any).FB.init({
          appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "1234567890",
          cookie: true,
          xfbml: true,
          version: "v16.0",
        });
      };
    }
  }, []);

  // Try rendering Google Sign-In standard button automatically
  useEffect(() => {
    if (isOpen && mode !== "forgot" && typeof window !== "undefined") {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      
      const renderBtnInterval = setInterval(() => {
        if ((window as any).google && document.getElementById("google-signin-btn")) {
          clearInterval(renderBtnInterval);
          try {
            (window as any).google.accounts.id.initialize({
              client_id: clientId || "placeholder-client-id",
              callback: async (response: any) => {
                try {
                  setError(null);
                  setSsoLoading(true);
                  await loginWithGoogle(response.credential);
                  onClose();
                } catch (err: any) {
                  setError(err.message || "Google authentication failed.");
                } finally {
                  setSsoLoading(false);
                }
              },
            });
            
            (window as any).google.accounts.id.renderButton(
              document.getElementById("google-signin-btn"),
              { 
                theme: "outline", 
                size: "large", 
                width: "382",
                text: "continue_with",
                shape: "circle"
              }
            );
          } catch (e) {
            console.error("GSI render button error:", e);
          }
        }
      }, 500);

      return () => clearInterval(renderBtnInterval);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email.trim(), password);
        onClose();
      } else if (mode === "signup") {
        if (!fullName.trim() || !email.trim() || !password) {
          throw new Error("Please fill in all required fields.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        await signup(fullName.trim(), email.trim(), password, phone.trim() || undefined);
        onClose();
      } else if (mode === "forgot") {
        if (!email.trim()) {
          throw new Error("Please enter your email address.");
        }
        await forgotPassword(email.trim());
        setSuccessMessage("If your email is registered, a password reset link has been sent.");
      }
    } catch (err: any) {
      setError(err.message || "Authentication request failed. Please check details.");
    } finally {
      setLoading(false);
    }
  };

  const triggerFacebookLogin = () => {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    if (!appId) {
      alert("Facebook App ID is not configured. Please define NEXT_PUBLIC_FACEBOOK_APP_ID.");
      return;
    }

    if (typeof window !== "undefined" && (window as any).FB) {
      setError(null);
      setSsoLoading(true);
      (window as any).FB.login(
        (response: any) => {
          if (response.authResponse) {
            loginWithFacebook(response.authResponse.accessToken)
              .then(() => onClose())
              .catch((err) => setError(err.message || "Facebook authentication failed."))
              .finally(() => setSsoLoading(false));
          } else {
            setSsoLoading(false);
            setError("Facebook login was cancelled or failed.");
          }
        },
        { scope: "email" }
      );
    } else {
      setError("Facebook SDK is loading. Please try again shortly.");
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
            {mode === "login" && "Welcome Back"}
            {mode === "signup" && "Create Health Account"}
            {mode === "forgot" && "Recover Password"}
          </h3>
          <p className="mt-1 text-xs text-foreground/60">
            {mode === "login" && "Access your personalized wellness profile and orders."}
            {mode === "signup" && "Sign up to book consultations and purchase remedies."}
            {mode === "forgot" && "Enter your email to receive a password reset link."}
          </p>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs font-semibold leading-relaxed mb-4 text-center">
            ⚠️ {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-[#e8f5e9] border border-[#a5d6a7] text-[#2e7d32] rounded-xl p-3 text-xs font-semibold leading-relaxed mb-4 text-center">
            ✓ {successMessage}
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-[10px] font-bold text-foreground/70 mb-1.5 uppercase tracking-wider">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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

          {mode === "signup" && (
            <div>
              <label className="block text-[10px] font-bold text-foreground/70 mb-1.5 uppercase tracking-wider">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="block w-full rounded-xl border border-foreground/15 bg-background px-4 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-medium"
              />
            </div>
          )}

          {mode !== "forgot" && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-bold text-foreground/70 uppercase tracking-wider">
                  Password *
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-[10px] text-accent-gold hover:underline font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Forgot?
                  </button>
                )}
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
          )}

          <button
            type="submit"
            disabled={loading || ssoLoading}
            className="w-full bg-primary hover:bg-primary-hover text-white py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 disabled:opacity-50 shadow-md shadow-primary/10 cursor-pointer mt-2"
          >
            {loading ? "Processing..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Reset Password"}
          </button>
        </form>

        {/* SSO Social Logins Section */}
        {mode !== "forgot" && (
          <div className="mt-6 space-y-4">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-foreground/10"></div>
              <span className="flex-shrink mx-4 text-[10px] text-foreground/40 font-bold uppercase tracking-wider">
                Or Continue With
              </span>
              <div className="flex-grow border-t border-foreground/10"></div>
            </div>

            {/* Google official button render container */}
            <div className="flex flex-col items-center justify-center min-h-[40px] bg-white rounded-xl border border-foreground/10 overflow-hidden py-1">
              <div id="google-signin-btn" className="w-full flex justify-center"></div>
            </div>

            {/* Facebook custom button */}
            <button
              type="button"
              onClick={triggerFacebookLogin}
              disabled={loading || ssoLoading}
              className="w-full flex items-center justify-center gap-x-2 border border-foreground/10 hover:bg-foreground/5 bg-white text-foreground py-2.5 px-4 rounded-full text-xs font-semibold transition-all duration-300 disabled:opacity-50 cursor-pointer"
            >
              <svg className="h-4.5 w-4.5 text-[#1877f2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Continue with Facebook</span>
            </button>
          </div>
        )}

        {/* Modal Toggle Footer Links */}
        <div className="mt-6 text-center border-t border-foreground/5 pt-4">
          {mode === "login" && (
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
          )}
          {mode === "signup" && (
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
          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-xs text-primary hover:underline font-bold cursor-pointer"
            >
              ← Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

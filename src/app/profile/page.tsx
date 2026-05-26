"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, loading, updateProfile } = useAuth();
  const router = useRouter();

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Initialize edit fields when user is loaded
  useEffect(() => {
    if (user) {
      setEditName(user?.name || "");
      setEditEmail(user?.email || "");
    }
  }, [user]);

  // If page is finished loading and user is not authenticated, redirect to home page after a delay or show login message
  useEffect(() => {
    if (!loading && !user) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [loading, user, router]);

  useEffect(() => {
    document.title = "My Profile | Classic Health";
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex-grow flex items-center justify-center bg-[#faf9f5] min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            <p className="text-xs text-foreground/50 font-serif">Loading your profile details...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="flex-grow flex items-center justify-center bg-[#faf9f5] min-h-[60vh] px-4">
          <div className="max-w-md w-full bg-[#faf9f5] border border-foreground/5 rounded-3xl p-8 text-center shadow-lg">
            <span className="h-10 w-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
              !
            </span>
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
              Authentication Required
            </h3>
            <p className="text-xs text-foreground/60 leading-relaxed mb-6">
              You must be logged in to view your profile. You will be redirected to the home page shortly, or you can log in using the menu above.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold uppercase tracking-wider py-3 px-6 rounded-full transition-all"
            >
              Go to Home Page
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditSuccess(null);
    setUpdating(true);

    try {
      if (!editName.trim()) {
        throw new Error("Name is required.");
      }
      if (!editEmail.trim()) {
        throw new Error("Email address is required.");
      }
      
      await updateProfile(editName.trim(), editEmail.trim());
      setEditSuccess("Your profile has been updated successfully.");
      setIsEditing(false);
    } catch (err: any) {
      setEditError(err.message || "Failed to update profile details. Please check inputs.");
    } finally {
      setUpdating(false);
    }
  };

  const formattedJoinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently";

  return (
    <>
      <Navbar />
      <main className="flex-grow bg-[#faf9f5] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Profile Header */}
          <div className="mb-10 text-center">
            <span className="h-2 w-2 rounded-full bg-accent-gold inline-block mr-2" />
            <span className="font-serif text-xs font-bold tracking-widest text-[#1e3f20] uppercase">
              Member Sanctuary
            </span>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              My Profile
            </h1>
            <p className="mt-2 text-xs text-foreground/60">
              Manage your personal information and track your wellness registration.
            </p>
          </div>

          {/* Messages Alert */}
          {editError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-xs font-semibold leading-relaxed mb-6 text-center max-w-xl mx-auto">
              ⚠️ {editError}
            </div>
          )}
          {editSuccess && (
            <div className="bg-[#e8f5e9] border border-[#a5d6a7] text-[#2e7d32] rounded-2xl p-4 text-xs font-semibold leading-relaxed mb-6 text-center max-w-xl mx-auto">
              ✓ {editSuccess}
            </div>
          )}

          {/* Profile Detail Card */}
          <div className="bg-[#faf9f5] border border-foreground/5 rounded-3xl p-6 sm:p-10 shadow-xl max-w-2xl mx-auto">
            {!isEditing ? (
              // Display Mode
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-foreground/5">
                  {/* Minimalist Avatar */}
                  <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-3xl shadow-sm border border-primary/5">
                    {(user?.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="text-center sm:text-left space-y-1">
                    <h2 className="font-serif text-2xl font-semibold text-foreground">{user?.name || "User"}</h2>
                    <span className="inline-block bg-[#e8f5e9] text-[#2e7d32] text-[10px] font-bold tracking-wider px-3 py-1 rounded-full uppercase">
                      {user?.role || "user"} Member
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <span className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">
                      Email Address
                    </span>
                    <span className="text-sm font-medium text-foreground">{user?.email || ""}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1">
                      Joined Date
                    </span>
                    <span className="text-sm font-medium text-foreground">{formattedJoinedDate}</span>
                  </div>
                </div>

                <div className="pt-4 flex justify-center sm:justify-start">
                  <button
                    onClick={() => {
                      setEditName(user?.name || "");
                      setEditEmail(user?.email || "");
                      setIsEditing(true);
                      setEditError(null);
                      setEditSuccess(null);
                    }}
                    className="bg-[#1e3f20] hover:bg-[#1e3f20]/90 text-white text-xs font-semibold uppercase tracking-wider py-3 px-6 rounded-full transition-all duration-300 shadow-md shadow-primary/10 cursor-pointer"
                  >
                    Edit Profile Details
                  </button>
                </div>
              </div>
            ) : (
              // Edit Mode
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-foreground/5">
                  <h3 className="font-serif text-lg font-semibold text-foreground">
                    Update Account Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-xs font-bold text-foreground/50 hover:text-foreground hover:underline"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-foreground/70 mb-1.5 uppercase tracking-wider">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your full name"
                      className="block w-full rounded-xl border border-foreground/15 bg-background px-4 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-foreground/70 mb-1.5 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Your email address"
                      className="block w-full rounded-xl border border-foreground/15 bg-background px-4 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="submit"
                    disabled={updating}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold uppercase tracking-wider py-3 px-6 rounded-full transition-all duration-300 disabled:opacity-50 shadow-md shadow-primary/10 cursor-pointer"
                  >
                    {updating ? "Saving Changes..." : "Save Details"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="border border-foreground/15 hover:bg-foreground/5 text-foreground text-xs font-semibold uppercase tracking-wider py-3 px-6 rounded-full transition-all cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

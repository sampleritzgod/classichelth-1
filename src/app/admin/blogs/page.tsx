"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { API_ENDPOINTS } from "@/config";

interface BlogItem {
  _id: string;
  title: string;
  category: string;
  isPublished: boolean;
  readingTime: number;
  createdAt: string;
}

export default function AdminBlogsBoard() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API_ENDPOINTS.adminBlogs, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load blog entries.");
      }

      const json = await response.json();
      if (json.success) {
        setBlogs(json.data);
      } else {
        throw new Error(json.message || "Failed to parse blog entries.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to connect to the backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Quick toggle isPublished status
  const handleTogglePublish = async (id: string, currentPublishedState: boolean) => {
    try {
      const targetState = !currentPublishedState;
      const response = await fetch(`${API_ENDPOINTS.adminBlogs}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
        },
        body: JSON.stringify({ isPublished: targetState }),
      });

      const json = await response.json();
      if (response.ok && json.success) {
        showToast(`Article status updated to ${targetState ? "Published" : "Draft"}`);
        setBlogs((prev) =>
          prev.map((b) => (b._id === id ? { ...b, isPublished: targetState } : b))
        );
      } else {
        throw new Error(json.message || "Failed to update publish state");
      }
    } catch (err: any) {
      showToast(err.message || "Error updating publish state", "error");
    }
  };

  // Delete article handler
  const handleDeleteBlog = async (id: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.adminBlogs}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
        },
      });

      const json = await response.json();
      if (response.ok && json.success) {
        showToast("Article deleted successfully");
        setBlogs((prev) => prev.filter((b) => b._id !== id));
      } else {
        throw new Error(json.message || "Failed to delete article");
      }
    } catch (err: any) {
      showToast(err.message || "Could not delete article", "error");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center p-4 rounded-xl shadow-lg border transition-all duration-300 ${
          toast.type === "success" 
            ? "bg-green-50 border-green-200 text-green-800" 
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-foreground/5 pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight font-serif text-foreground">
            Blog Board
          </h1>
          <p className="text-xs text-foreground/50 mt-1">
            Write new medical guides, toggle publish visibility, and update your public insights database.
          </p>
        </div>

        <Link
          href="/admin/blogs/new"
          className="mt-4 sm:mt-0 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-white hover:bg-primary-hover cursor-pointer transition-all shadow-md shadow-primary/10"
        >
          + Add New Article
        </Link>
      </div>

      {/* Table Listing */}
      <div className="bg-white rounded-2xl border border-foreground/5 shadow-xs overflow-hidden">
        {loading && blogs.length === 0 ? (
          <div className="p-8 space-y-6">
            {[1, 2].map((n) => (
              <div key={n} className="flex items-center justify-between border-b border-foreground/5 pb-4 last:border-0 last:pb-0 animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-foreground/10 rounded" />
                  <div className="h-3 w-72 bg-foreground/5 rounded" />
                </div>
                <div className="h-8 w-24 bg-foreground/10 rounded-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 font-semibold">{error}</div>
        ) : blogs.length === 0 ? (
          <div className="p-16 text-center">
            <span className="text-4xl block mb-4">📝</span>
            <h3 className="font-serif text-lg font-medium text-foreground mb-1">
              No journal articles found.
            </h3>
            <p className="text-xs text-foreground/50 max-w-sm mx-auto mb-6">
              Create your first article by clicking the "+ Add New Article" button.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-foreground/10 bg-accent-soft/40">
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-foreground/75">
                    Article Title
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-foreground/75">
                    Category
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-foreground/75">
                    Read Time
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-foreground/75">
                    Date Created
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-foreground/75">
                    Status
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-foreground/75 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {blogs.map((blog) => (
                  <tr key={blog._id} className="hover:bg-accent-soft/10 transition-colors">
                    {/* Title */}
                    <td className="py-5 px-6 font-serif text-base font-semibold text-foreground max-w-xs truncate">
                      {blog.title}
                    </td>

                    {/* Category */}
                    <td className="py-5 px-6 text-xs font-semibold text-primary">
                      {blog.category}
                    </td>

                    {/* Read Time */}
                    <td className="py-5 px-6 text-xs text-foreground/50 font-mono">
                      {blog.readingTime} min
                    </td>

                    {/* Date */}
                    <td className="py-5 px-6 text-xs text-foreground/50">
                      {formatDate(blog.createdAt)}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-5 px-6">
                      <button
                        onClick={() => handleTogglePublish(blog._id, blog.isPublished)}
                        className={`inline-flex items-center gap-x-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                          blog.isPublished
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                        title="Click to toggle status"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${blog.isPublished ? "bg-green-600 animate-pulse" : "bg-amber-600"}`} />
                        {blog.isPublished ? "Published" : "Draft"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-5 px-6 text-right space-x-3">
                      <Link
                        href={`/admin/blogs/edit/${blog._id}`}
                        className="inline-flex items-center justify-center p-2 rounded-full bg-primary/5 text-primary hover:bg-primary/10 transition-all"
                        title="Edit Article"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>

                      <button
                        onClick={() => setDeleteConfirmId(blog._id)}
                        className="inline-flex items-center justify-center p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer"
                        title="Delete Article"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setDeleteConfirmId(null)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-xs"
          />
          <div className="relative bg-background p-6 rounded-2xl border border-foreground/5 shadow-xl max-w-sm w-full z-10 animate-fade-up">
            <h3 className="font-serif text-lg font-semibold text-primary mb-2">Delete Article?</h3>
            <p className="text-xs text-foreground/60 leading-relaxed mb-6">
              Are you sure you want to permanently delete this journal entry? This action will remove it from the public website and cannot be undone.
            </p>
            <div className="flex gap-x-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-foreground/15 rounded-full text-xs font-semibold text-foreground/80 hover:bg-foreground/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBlog(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 text-white rounded-full text-xs font-semibold hover:bg-red-700 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

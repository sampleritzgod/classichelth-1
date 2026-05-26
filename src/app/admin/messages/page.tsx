"use client";

import React, { useEffect, useState, useCallback } from "react";
import { API_ENDPOINTS } from "@/config";

interface Message {
  _id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  // Notification Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Deletion ID state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = API_ENDPOINTS.adminMessages;
      if (filter === "unread") {
        url += "?isRead=false";
      } else if (filter === "read") {
        url += "?isRead=true";
      }

      const response = await fetch(url, {
        headers: {
          Authorization: "Bearer mock_token",
        },
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      if (json.success) {
        setMessages(json.data);
      } else {
        throw new Error(json.message || "Failed to load messages");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to retrieve messages from the backend server.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const toggleReadStatus = async (id: string, currentReadState: boolean) => {
    try {
      const targetState = !currentReadState;
      const response = await fetch(`${API_ENDPOINTS.adminMessages}/${id}/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock_token",
        },
        body: JSON.stringify({ isRead: targetState }),
      });

      const json = await response.json();
      if (response.ok && json.success) {
        showToast(`Message marked as ${targetState ? "read" : "unread"}`);
        // Update local state
        setMessages((prev) =>
          prev.map((msg) => (msg._id === id ? { ...msg, isRead: targetState } : msg))
        );
      } else {
        throw new Error(json.message || "Failed to update message status");
      }
    } catch (err: any) {
      showToast(err.message || "Could not modify message status", "error");
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.adminMessages}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer mock_token",
        },
      });

      const json = await response.json();
      if (response.ok && json.success) {
        showToast("Message deleted successfully");
        setMessages((prev) => prev.filter((msg) => msg._id !== id));
      } else {
        throw new Error(json.message || "Failed to delete message");
      }
    } catch (err: any) {
      showToast(err.message || "Could not delete message", "error");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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
            Contact Inbox
          </h1>
          <p className="text-xs text-foreground/50 mt-1">
            Review inquiries, messages, and therapy booking questions sent by site visitors.
          </p>
        </div>

        <button
          onClick={fetchMessages}
          disabled={loading}
          className="mt-4 sm:mt-0 inline-flex items-center justify-center rounded-full border border-primary px-5 py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 cursor-pointer disabled:opacity-50 transition-all shadow-xs"
        >
          {loading ? "Refreshing..." : "Refresh Inbox"}
        </button>
      </div>

      {/* Filter tab bar */}
      <div className="flex gap-x-2 border-b border-foreground/5 pb-1">
        {(["all", "unread", "read"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              filter === tab
                ? "border-primary text-primary"
                : "border-transparent text-foreground/50 hover:text-primary"
            }`}
          >
            {tab === "all" ? "All Messages" : tab === "unread" ? "Unread Only" : "Archived / Read"}
          </button>
        ))}
      </div>

      {/* Main Inbox Container */}
      <div className="space-y-4">
        {loading && messages.length === 0 ? (
          /* Skeletons */
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-foreground/5 p-6 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 font-semibold">{error}</div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-foreground/5 p-16 text-center shadow-xs">
            <span className="text-4xl block mb-4">📥</span>
            <h3 className="font-serif text-lg font-medium text-foreground mb-1">
              Inbox is empty.
            </h3>
            <p className="text-xs text-foreground/50 max-w-xs mx-auto">
              No inquiries match the current folder filter.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`bg-white rounded-2xl border p-6 shadow-xs flex flex-col justify-between transition-all duration-300 hover:shadow-md ${
                msg.isRead 
                  ? "border-foreground/5 opacity-70" 
                  : "border-primary/20 bg-primary/[0.01]"
              }`}
            >
              {/* Header inside card */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-y-2 pb-3 border-b border-foreground/5 mb-4">
                <div>
                  <h3 className={`text-base font-serif text-foreground ${!msg.isRead ? "font-bold" : "font-medium"}`}>
                    {msg.name}
                  </h3>
                  <p className="text-xs text-foreground/50 mt-0.5">
                    {msg.email} • Sent at {formatDate(msg.createdAt)}
                  </p>
                </div>

                <div className="flex gap-x-2">
                  <button
                    onClick={() => toggleReadStatus(msg._id, msg.isRead)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      msg.isRead
                        ? "bg-foreground/5 text-foreground/75 border-foreground/10 hover:bg-foreground/10"
                        : "bg-primary text-white border-primary hover:bg-primary-hover shadow-xs"
                    }`}
                  >
                    {msg.isRead ? "Mark Unread" : "Mark Read"}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(msg._id)}
                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100 cursor-pointer"
                    title="Delete Message"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Message text */}
              <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {msg.message}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Confirmation modal for delete */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setDeleteConfirmId(null)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-xs"
          />
          <div className="relative bg-background p-6 rounded-2xl border border-foreground/5 shadow-xl max-w-sm w-full z-10 animate-fade-up">
            <h3 className="font-serif text-lg font-semibold text-primary mb-2">Delete Message?</h3>
            <p className="text-xs text-foreground/60 leading-relaxed mb-6">
              Are you sure you want to permanently delete this contact inquiry? This action cannot be undone.
            </p>
            <div className="flex gap-x-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-foreground/15 rounded-full text-xs font-semibold text-foreground/80 hover:bg-foreground/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMessage(deleteConfirmId)}
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

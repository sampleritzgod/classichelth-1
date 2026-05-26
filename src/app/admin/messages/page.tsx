"use client";

import React, { useEffect, useState, useCallback } from "react";
import { API_ENDPOINTS } from "@/config";

interface Reply {
  message: string;
  sentAt: string;
}

interface Message {
  _id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  replies: Reply[];
  createdAt: string;
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filter, setFilter] = useState<"all" | "unread" | "starred" | "archived">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Notification Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modal / Interaction states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [replyMessageId, setReplyMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let queryParams: string[] = [];
      
      if (filter === "unread") {
        queryParams.push("isRead=false");
      } else if (filter === "starred") {
        queryParams.push("isStarred=true");
      } else if (filter === "archived") {
        queryParams.push("isArchived=true");
      }

      if (searchQuery.trim() !== "") {
        queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
      }

      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const url = `${API_ENDPOINTS.adminMessages}${queryString}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
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
  }, [filter, searchQuery]);

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
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
        },
        body: JSON.stringify({ isRead: targetState }),
      });

      const json = await response.json();
      if (response.ok && json.success) {
        showToast(`Message marked as ${targetState ? "read" : "unread"}`);
        setMessages((prev) =>
          prev.map((msg) => (msg._id === id ? { ...msg, isRead: targetState } : msg))
        );
        if (selectedMessage?._id === id) {
          setSelectedMessage((prev) => prev ? { ...prev, isRead: targetState } : null);
        }
      } else {
        throw new Error(json.message || "Failed to update message status");
      }
    } catch (err: any) {
      showToast(err.message || "Could not modify message status", "error");
    }
  };

  const toggleStarredStatus = async (id: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.adminMessages}/${id}/star`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
        },
      });

      const json = await response.json();
      if (response.ok && json.success) {
        const updatedMsg = json.data;
        showToast(updatedMsg.isStarred ? "Message starred" : "Message unstarred");
        setMessages((prev) =>
          prev.map((msg) => (msg._id === id ? { ...msg, isStarred: updatedMsg.isStarred } : msg))
        );
        if (selectedMessage?._id === id) {
          setSelectedMessage((prev) => prev ? { ...prev, isStarred: updatedMsg.isStarred } : null);
        }
      } else {
        throw new Error(json.message || "Failed to update star status");
      }
    } catch (err: any) {
      showToast(err.message || "Could not modify star status", "error");
    }
  };

  const toggleArchivedStatus = async (id: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.adminMessages}/${id}/archive`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
        },
      });

      const json = await response.json();
      if (response.ok && json.success) {
        const updatedMsg = json.data;
        showToast(updatedMsg.isArchived ? "Message moved to Archive" : "Message restored to Inbox");
        
        // Remove from list if filter is not "archived" and it is archived
        if (filter !== "archived" && updatedMsg.isArchived) {
          setMessages((prev) => prev.filter((msg) => msg._id !== id));
        } else if (filter === "archived" && !updatedMsg.isArchived) {
          setMessages((prev) => prev.filter((msg) => msg._id !== id));
        } else {
          setMessages((prev) =>
            prev.map((msg) => (msg._id === id ? { ...msg, isArchived: updatedMsg.isArchived } : msg))
          );
        }
        
        if (selectedMessage?._id === id) {
          setSelectedMessage((prev) => prev ? { ...prev, isArchived: updatedMsg.isArchived } : null);
        }
      } else {
        throw new Error(json.message || "Failed to update archive status");
      }
    } catch (err: any) {
      showToast(err.message || "Could not modify archive status", "error");
    }
  };

  const handleReplyMessage = async () => {
    if (!replyMessageId || !replyText.trim()) return;

    try {
      setReplying(true);
      const response = await fetch(`${API_ENDPOINTS.adminMessages}/${replyMessageId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
        },
        body: JSON.stringify({ replyText }),
      });

      const json = await response.json();
      if (response.ok && json.success) {
        showToast("Reply sent successfully via email!");
        // Update local state message with the new reply
        setMessages((prev) =>
          prev.map((msg) => (msg._id === replyMessageId ? json.data : msg))
        );
        if (selectedMessage?._id === replyMessageId) {
          setSelectedMessage(json.data);
        }
        setReplyMessageId(null);
        setReplyText("");
      } else {
        throw new Error(json.message || "Failed to send email reply");
      }
    } catch (err: any) {
      showToast(err.message || "Could not transmit reply email", "error");
    } finally {
      setReplying(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.adminMessages}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
        },
      });

      const json = await response.json();
      if (response.ok && json.success) {
        showToast("Message deleted successfully");
        setMessages((prev) => prev.filter((msg) => msg._id !== id));
        if (selectedMessage?._id === id) {
          setSelectedMessage(null);
        }
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
        year: "numeric",
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-foreground/5 pb-6 gap-y-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight font-serif text-foreground">
            Contact Inbox
          </h1>
          <p className="text-xs text-foreground/50 mt-1">
            Review inquiries, messages, and therapy booking questions sent by site visitors.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search sender, email or text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 text-xs rounded-full border border-foreground/15 bg-white text-foreground focus:outline-none focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/80 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={fetchMessages}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full border border-primary px-5 py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 cursor-pointer disabled:opacity-50 transition-all shadow-xs"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Filter tab bar */}
      <div className="flex gap-x-2 border-b border-foreground/5 pb-1 overflow-x-auto">
        {(["all", "unread", "starred", "archived"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              filter === tab
                ? "border-primary text-primary"
                : "border-transparent text-foreground/50 hover:text-primary"
            }`}
          >
            {tab === "all" ? "Inbox" : tab === "unread" ? "Unread" : tab === "starred" ? "Starred ★" : "Archived 📥"}
          </button>
        ))}
      </div>

      {/* Grid: Left - Message List, Right - Details Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Messages List Column */}
        <div className="lg:col-span-5 space-y-4">
          {loading && messages.length === 0 ? (
            /* Skeletons */
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-white rounded-2xl border border-foreground/5 p-4 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600 font-semibold border border-red-100 bg-red-50/50 rounded-2xl">{error}</div>
          ) : messages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-foreground/5 p-12 text-center shadow-xs">
              <span className="text-3xl block mb-3">📥</span>
              <h3 className="font-serif text-base font-medium text-foreground mb-1">
                No messages found.
              </h3>
              <p className="text-[11px] text-foreground/50 max-w-xs mx-auto">
                No inquiries match your filter or search query.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between transition-all duration-300 cursor-pointer hover:border-primary/30 ${
                    selectedMessage?._id === msg._id
                      ? "border-primary bg-primary/[0.02] ring-1 ring-primary/20"
                      : msg.isRead
                      ? "border-foreground/5 opacity-80"
                      : "border-primary/20 bg-primary/[0.01]"
                  }`}
                >
                  <div className="flex justify-between items-start gap-x-2 mb-2">
                    <div>
                      <h3 className={`text-sm font-serif text-foreground ${!msg.isRead ? "font-bold text-primary" : "font-semibold"}`}>
                        {msg.name}
                      </h3>
                      <p className="text-[10px] text-foreground/50">
                        {formatDate(msg.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStarredStatus(msg._id);
                        }}
                        className={`p-1 rounded-full text-xs transition-colors hover:bg-foreground/5 ${
                          msg.isStarred ? "text-amber-500 font-bold" : "text-foreground/30"
                        }`}
                      >
                        {msg.isStarred ? "★" : "☆"}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-foreground/70 line-clamp-2 leading-relaxed">
                    {msg.message}
                  </p>

                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-foreground/5">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${
                      msg.replies && msg.replies.length > 0
                        ? "text-primary/70"
                        : "text-foreground/40"
                    }`}>
                      {msg.replies && msg.replies.length > 0 ? `✓ Replied (${msg.replies.length})` : "Pending Reply"}
                    </span>
                    <span className={`h-1.5 w-1.5 rounded-full ${msg.isRead ? "bg-foreground/15" : "bg-[#4caf50]"}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Message Details Panel */}
        <div className="lg:col-span-7">
          {selectedMessage ? (
            <div className="bg-white rounded-2xl border border-foreground/5 p-6 shadow-xs space-y-6 sticky top-24">
              {/* Toolbar */}
              <div className="flex justify-between items-start border-b border-foreground/5 pb-4">
                <div>
                  <h2 className="text-lg font-serif font-bold text-primary">
                    {selectedMessage.name}
                  </h2>
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="text-xs text-primary/80 hover:underline hover:text-primary transition-all block mt-0.5"
                  >
                    {selectedMessage.email}
                  </a>
                </div>

                <div className="flex gap-x-1.5">
                  <button
                    onClick={() => toggleStarredStatus(selectedMessage._id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-x-1 transition-all cursor-pointer ${
                      selectedMessage.isStarred
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-background text-foreground/60 border-foreground/10 hover:bg-foreground/5"
                    }`}
                  >
                    <span>{selectedMessage.isStarred ? "Starred ★" : "Star"}</span>
                  </button>

                  <button
                    onClick={() => toggleReadStatus(selectedMessage._id, selectedMessage.isRead)}
                    className="px-3 py-1.5 rounded-lg border bg-background text-foreground/60 border-foreground/10 hover:bg-foreground/5 text-xs font-semibold cursor-pointer"
                  >
                    {selectedMessage.isRead ? "Mark Unread" : "Mark Read"}
                  </button>

                  <button
                    onClick={() => toggleArchivedStatus(selectedMessage._id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      selectedMessage.isArchived
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "bg-background text-foreground/60 border-foreground/10 hover:bg-foreground/5"
                    }`}
                  >
                    {selectedMessage.isArchived ? "Inbox" : "Archive"}
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(selectedMessage._id)}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 cursor-pointer"
                    title="Delete Permanently"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Message Content Body */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-foreground/40 block">Message:</span>
                <div className="bg-foreground/[0.02] border border-foreground/5 p-4 rounded-xl text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
                <span className="text-[10px] text-foreground/30 block text-right">
                  Received on {formatDate(selectedMessage.createdAt)}
                </span>
              </div>

              {/* Reply History Timeline */}
              {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-foreground/5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary block">Clinic Correspondence History:</span>
                  <div className="space-y-3">
                    {selectedMessage.replies.map((rep, idx) => (
                      <div key={idx} className="bg-primary/[0.02] border border-primary/10 p-3 rounded-xl space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-primary">Response from Clinic Team</span>
                          <span className="text-[9px] text-foreground/40">{formatDate(rep.sentAt)}</span>
                        </div>
                        <p className="text-xs text-foreground/75 leading-relaxed whitespace-pre-wrap">
                          {rep.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-foreground/5 flex justify-end">
                <button
                  onClick={() => {
                    setReplyMessageId(selectedMessage._id);
                    setReplyText("");
                  }}
                  className="bg-primary text-white hover:bg-primary-hover px-5 py-2.5 rounded-full text-xs font-semibold cursor-pointer shadow-xs transition-all flex items-center gap-x-1.5"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span>Compose Email Reply</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-foreground/5 p-16 text-center shadow-xs flex flex-col items-center justify-center h-[350px]">
              <span className="text-4xl block mb-4">💬</span>
              <h3 className="font-serif text-base font-medium text-foreground mb-1">
                Select an Inquiry
              </h3>
              <p className="text-xs text-foreground/50 max-w-xs mx-auto">
                Choose a customer message from the sidebar list to view the conversation history, manage flags, or compose replies.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {replyMessageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setReplyMessageId(null)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-xs"
          />
          <div className="relative bg-background p-6 rounded-2xl border border-foreground/5 shadow-xl max-w-lg w-full z-10 animate-fade-up flex flex-col space-y-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-primary">Reply to {selectedMessage?.name}</h3>
              <p className="text-[10px] text-foreground/50">
                This response will be packaged into a premium email template and sent directly to <strong>{selectedMessage?.email}</strong>.
              </p>
            </div>

            {/* Original message snippet */}
            <div className="bg-foreground/[0.02] border border-foreground/5 p-3 rounded-lg max-h-[80px] overflow-y-auto">
              <span className="text-[9px] uppercase font-bold text-foreground/40 block mb-1">Original Inquiry:</span>
              <p className="text-[11px] text-foreground/60 italic leading-relaxed">
                "{selectedMessage?.message}"
              </p>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-foreground/50 tracking-wider mb-1.5">
                Reply Message Content
              </label>
              <textarea
                rows={6}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your wellness guidance response here..."
                className="w-full px-4 py-3 rounded-xl border border-foreground/15 bg-white text-foreground text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-y"
              />
            </div>

            <div className="flex gap-x-3 justify-end pt-2">
              <button
                onClick={() => setReplyMessageId(null)}
                className="px-4 py-2 border border-foreground/15 rounded-full text-xs font-semibold text-foreground/80 hover:bg-foreground/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReplyMessage}
                disabled={replying || !replyText.trim()}
                className="px-5 py-2 bg-primary text-white rounded-full text-xs font-semibold hover:bg-primary-hover disabled:opacity-50 cursor-pointer shadow-xs transition-all"
              >
                {replying ? "Sending Reply Email..." : "Send Response"}
              </button>
            </div>
          </div>
        </div>
      )}

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

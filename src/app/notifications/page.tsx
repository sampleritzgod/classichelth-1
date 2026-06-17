"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useNotifications } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { notifications, unreadCount, loading: notifLoading, markAsRead, markAllAsRead } = useNotifications();

  // Open login modal if guest attempts to access notifications
  useEffect(() => {
    if (!authLoading && !user) {
      window.dispatchEvent(new CustomEvent("open_auth_modal", { detail: { mode: "login" } }));
    }
  }, [user, authLoading]);

  const formatTimeAgo = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch (e) {
      return dateStr;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking_confirmation":
        return (
          <span className="h-9 w-9 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center justify-center text-sm font-bold">
            ✓
          </span>
        );
      case "reminder":
        return (
          <span className="h-9 w-9 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-sm font-bold">
            ⏰
          </span>
        );
      case "status_update":
      default:
        return (
          <span className="h-9 w-9 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center text-sm font-bold">
            ℹ
          </span>
        );
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          <p className="text-xs text-foreground/50 font-serif">Loading notifications panel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-foreground/5 shadow-xl text-center space-y-6">
          <span className="text-4xl block">🔒</span>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-primary">
            Sign In Required
          </h2>
          <p className="text-xs text-foreground/60 leading-relaxed">
            Please log in to your U 1st account to access your personalized notification history and appointment alerts.
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open_auth_modal", { detail: { mode: "login" } }))}
            className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 sm:py-20 lg:py-24 bg-accent-soft/10 min-h-screen">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-foreground/5 pb-6 mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight font-serif text-foreground">
              Notifications
            </h1>
            <p className="text-xs text-foreground/50 mt-1">
              Your real-time booking alerts, confirmation receipts, and practitioner updates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-primary hover:underline bg-white border border-foreground/5 px-4 py-2 rounded-full cursor-pointer"
              >
                Mark all read
              </button>
            )}
            <Link
              href="/profile"
              className="text-xs font-semibold text-foreground/70 bg-white border border-foreground/5 px-4 py-2 rounded-full hover:bg-foreground/5 transition-all"
            >
              My Profile
            </Link>
          </div>
        </div>

        {/* List */}
        {notifLoading && notifications.length === 0 ? (
          <div className="text-center py-16 animate-pulse space-y-4">
            <div className="h-6 w-32 bg-foreground/10 rounded mx-auto" />
            <div className="h-4 w-48 bg-foreground/5 rounded mx-auto" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-background rounded-3xl p-12 text-center border border-foreground/5 shadow-md">
            <span className="text-3xl block mb-2">🔔</span>
            <h3 className="font-serif text-lg font-semibold text-primary">No Notifications Yet</h3>
            <p className="text-xs text-foreground/50 mt-1 max-w-xs mx-auto">
              Any updates about your appointments or clinic remarks will appear right here in real time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`p-4 rounded-3xl border transition-all duration-300 flex items-start justify-between gap-4 group ${
                  notif.isRead
                    ? "bg-white/85 border-foreground/5 opacity-80"
                    : "bg-white border-primary/20 shadow-md shadow-primary/[0.02] ring-1 ring-primary/5"
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-foreground font-serif truncate">
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0 animate-pulse" />
                      )}
                    </div>
                    
                    <p className="text-xs text-foreground/75 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    
                    <span className="text-[9px] font-semibold text-foreground/40 mt-2 block">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Mark as read button */}
                {!notif.isRead && (
                  <button
                    onClick={() => markAsRead(notif._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] font-bold text-primary hover:underline whitespace-nowrap cursor-pointer mt-1 self-start"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

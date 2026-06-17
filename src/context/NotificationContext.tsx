"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { API_ENDPOINTS, API_URL } from "@/config";
import { useAuth } from "./AuthContext";

export interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.notifications, {
        credentials: "include"
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
        setUnreadCount(json.unreadCount);
      }
    } catch (err) {
      console.error("[Notification Context] Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.notifications}/${id}/read`, {
        method: "PATCH",
        credentials: "include"
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(prev =>
          prev.map(notif => (notif._id === id ? { ...notif, isRead: true } : notif))
        );
        setUnreadCount(prev => Math.max(prev - 1, 0));
      }
    } catch (err) {
      console.error("[Notification Context] Error marking read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.notifications}/read-all`, {
        method: "PATCH",
        credentials: "include"
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("[Notification Context] Error marking all read:", err);
    }
  };

  // 1. Fetch notifications & bind socket on login
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    fetchNotifications();

    // Set up real-time websocket
    console.log("[Notification Context] Connecting Socket.IO to:", API_URL);
    const newSocket = io(API_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true
    });

    newSocket.on("connect", () => {
      console.log("[Notification Context] Socket connected. Joining room:", user._id);
      newSocket.emit("join", user._id);
    });

    newSocket.on("notifications_updated", (data: { unreadCount: number }) => {
      console.log("[Notification Context] Socket: unread count update:", data);
      setUnreadCount(data.unreadCount);
    });

    newSocket.on("appointment_created", (data: any) => {
      console.log("[Notification Context] Socket: appointment_created:", data);
      fetchNotifications();
    });

    newSocket.on("appointment_updated", (data: any) => {
      console.log("[Notification Context] Socket: appointment_updated:", data);
      fetchNotifications();
    });

    newSocket.on("appointment_reminder", (data: any) => {
      console.log("[Notification Context] Socket: appointment_reminder:", data);
      fetchNotifications();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // 2. Browser FCM Push Registration
  useEffect(() => {
    if (!user) return;

    const setupFCM = async () => {
      // Avoid execution in non-browser env
      if (typeof window === "undefined" || !("Notification" in window)) {
        return;
      }

      // Check permission
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("[FCM Client] Notification permission denied.");
          return;
        }
      }

      try {
        const { initializeApp, getApps, getApp } = await import("firebase/app");
        const { getMessaging, getToken } = await import("firebase/messaging");

        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };

        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

        if (!firebaseConfig.apiKey) {
          console.log("[FCM Client] Firebase credentials missing. FCM running in MOCK mode.");
          return;
        }

        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        const messaging = getMessaging(app);

        // Register Service Worker
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        console.log("[FCM SW] Service Worker registered with scope:", registration.scope);

        // Retrieve token
        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration,
        });

        if (token) {
          console.log("[FCM Client] Retrieved FCM registration token:", token);
          // Register token with backend auth
          await fetch(API_ENDPOINTS.registerFcmToken, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ fcmToken: token }),
          });
        }
      } catch (err) {
        console.warn("[FCM Client] Firebase registration failed or skipped (Mock Mode active):", err);
      }
    };

    setupFCM();
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import type { Socket } from "socket.io-client";
import { API_ENDPOINTS, API_URL } from "@/config";
import { useAuth } from "./AuthContext";

// Realtime socket events other components can subscribe to via the shared socket.
export type RealtimeEvent =
  | "appointment_created"
  | "appointment_updated"
  | "appointment_reminder"
  | "admin_appointment_created"
  | "admin_appointment_updated"
  | "notifications_updated";

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
  // Subscribe to a realtime event over the single shared socket. Returns an
  // unsubscribe function. Used by the profile and admin dashboards to refresh
  // their data in real time without opening additional socket connections.
  subscribe: (event: RealtimeEvent, handler: (data: unknown) => void) => () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Registry of external subscribers keyed by event name, dispatched from the
  // single shared socket below.
  const listenersRef = useRef<Map<RealtimeEvent, Set<(data: unknown) => void>>>(new Map());

  const subscribe = useCallback(
    (event: RealtimeEvent, handler: (data: unknown) => void) => {
      const map = listenersRef.current;
      if (!map.has(event)) map.set(event, new Set());
      map.get(event)!.add(handler);
      return () => {
        map.get(event)?.delete(handler);
      };
    },
    []
  );

  const emitToSubscribers = useCallback((event: RealtimeEvent, data: unknown) => {
    listenersRef.current.get(event)?.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error(`[Notification Context] subscriber for ${event} threw:`, err);
      }
    });
  }, []);

  const fetchNotifications = useCallback(async () => {
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
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
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
  }, []);

  const markAllAsRead = useCallback(async () => {
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
  }, []);

  // 1. Fetch notifications & bind socket on login. socket.io-client is imported
  // dynamically so it is NOT shipped in the bundle for anonymous visitors.
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    let activeSocket: Socket | null = null;
    let cancelled = false;

    const connect = async () => {
      const { io } = await import("socket.io-client");
      if (cancelled) return;

      // The backend authenticates the handshake, so we forward the JWT
      // (cookie is also sent via withCredentials as a fallback).
      const authToken =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || localStorage.getItem("admin_token")
          : null;

      const newSocket = io(API_URL, {
        transports: ["websocket", "polling"],
        withCredentials: true,
        auth: { token: authToken },
      });

      newSocket.on("connect", () => {
        newSocket.emit("join", user._id);
      });

      newSocket.on("connect_error", (err) => {
        console.warn("[Notification Context] Socket connection error:", err.message);
      });

      newSocket.on("notifications_updated", (data: { unreadCount: number }) => {
        if (typeof data?.unreadCount === "number") setUnreadCount(data.unreadCount);
        emitToSubscribers("notifications_updated", data);
      });

      // User-facing appointment events: refresh the unread feed AND relay to
      // any subscribers (e.g. the profile dashboard refreshing its list).
      newSocket.on("appointment_created", (data: unknown) => {
        fetchNotifications();
        emitToSubscribers("appointment_created", data);
      });
      newSocket.on("appointment_updated", (data: unknown) => {
        fetchNotifications();
        emitToSubscribers("appointment_updated", data);
      });
      newSocket.on("appointment_reminder", (data: unknown) => {
        fetchNotifications();
        emitToSubscribers("appointment_reminder", data);
      });

      // Admin events: relay only (consumed by admin dashboards).
      newSocket.on("admin_appointment_created", (data: unknown) =>
        emitToSubscribers("admin_appointment_created", data)
      );
      newSocket.on("admin_appointment_updated", (data: unknown) =>
        emitToSubscribers("admin_appointment_updated", data)
      );

      activeSocket = newSocket;
    };

    connect();

    return () => {
      cancelled = true;
      if (activeSocket) {
        activeSocket.off();
        activeSocket.disconnect();
      }
    };
  }, [user, fetchNotifications, emitToSubscribers]);

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

  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead,
      fetchNotifications,
      subscribe,
    }),
    [notifications, unreadCount, loading, markAsRead, markAllAsRead, fetchNotifications, subscribe]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
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

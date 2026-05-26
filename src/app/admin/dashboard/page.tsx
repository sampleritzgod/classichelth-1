"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { API_ENDPOINTS } from "@/config";

interface DashboardStats {
  appointments: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    today: number;
  };
  messages: {
    total: number;
    unread: number;
  };
  latestBookings: Array<{
    _id: string;
    name: string;
    email: string;
    phone: string;
    date: string;
    timeSlot: string;
    condition?: string;
    status: "pending" | "confirmed" | "completed" | "cancelled";
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API_ENDPOINTS.adminStats);
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      } else {
        throw new Error(json.message || "Failed to load dashboard statistics");
      }
    } catch (err: any) {
      console.error("Dashboard Stats Fetch Error:", err);
      setError(err.message || "Unable to connect to the backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-foreground/10 rounded" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-foreground/5 rounded-2xl border border-foreground/5" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 h-80 bg-foreground/5 rounded-2xl border border-foreground/5" />
          <div className="h-80 bg-foreground/5 rounded-2xl border border-foreground/5" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6 text-center">
        <span className="text-2xl block mb-2">⚠️</span>
        <h3 className="text-sm font-semibold">Dashboard Connection Failed</h3>
        <p className="text-xs mt-1 max-w-md mx-auto opacity-80">{error || "Ensure your backend server is online."}</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-full text-xs font-semibold hover:bg-red-700 transition-colors"
        >
          Try Reconnecting
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight font-serif text-foreground">
          Dashboard Overview
        </h1>
        <p className="text-xs text-foreground/50 mt-1">
          Welcome back. Here is the operational activity overview for U 1st Creation.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Appointments */}
        <div className="bg-accent-soft/30 p-6 rounded-2xl border border-foreground/5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider block">
              Today's Schedule
            </span>
            <span className="text-3xl font-serif text-primary font-bold mt-2 block">
              {stats.appointments.today}
            </span>
          </div>
          <span className="text-[10px] text-foreground/40 mt-4 block">
            Appointments scheduled for today
          </span>
        </div>

        {/* Pending Approval */}
        <div className="bg-white p-6 rounded-2xl border border-foreground/5 flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider block">
              Pending Actions
            </span>
            <span className="text-3xl font-serif text-accent-gold font-bold mt-2 block">
              {stats.appointments.pending}
            </span>
          </div>
          <Link
            href="/admin/appointments?status=pending"
            className="text-[10px] text-primary font-semibold hover:underline mt-4 block"
          >
            Review pending bookings →
          </Link>
        </div>

        {/* Completed Bookings */}
        <div className="bg-white p-6 rounded-2xl border border-foreground/5 flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider block">
              Completed Therapies
            </span>
            <span className="text-3xl font-serif text-green-700 font-bold mt-2 block">
              {stats.appointments.completed}
            </span>
          </div>
          <span className="text-[10px] text-foreground/40 mt-4 block">
            Total successfully completed sessions
          </span>
        </div>

        {/* Unread Inquiries */}
        <div className="bg-white p-6 rounded-2xl border border-foreground/5 flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider block">
              Unread Messages
            </span>
            <span className="text-3xl font-serif text-primary font-bold mt-2 block">
              {stats.messages.unread}
            </span>
          </div>
          <Link
            href="/admin/messages"
            className="text-[10px] text-primary font-semibold hover:underline mt-4 block"
          >
            Open messages inbox →
          </Link>
        </div>
      </div>

      {/* Grid: Latest Bookings & General Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Latest Bookings */}
        <div className="bg-white rounded-2xl border border-foreground/5 p-6 shadow-xs lg:col-span-2">
          <div className="flex justify-between items-center border-b border-foreground/5 pb-4 mb-4">
            <h2 className="text-lg font-serif font-semibold text-primary">
              Recent Bookings
            </h2>
            <Link
              href="/admin/appointments"
              className="text-xs font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {stats.latestBookings.length === 0 ? (
            <p className="text-xs text-foreground/50 py-8 text-center">No bookings logged yet.</p>
          ) : (
            <div className="divide-y divide-foreground/5">
              {stats.latestBookings.map((booking) => (
                <div key={booking._id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground font-serif">{booking.name}</h3>
                    <p className="text-xs text-foreground/50 mt-0.5">
                      {formatDate(booking.date)} at {booking.timeSlot} • {booking.condition || "General Assessment"}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        booking.status === "confirmed"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : booking.status === "completed"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : booking.status === "cancelled"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Operations panel */}
        <div className="bg-accent-soft/10 rounded-2xl border border-foreground/5 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-serif font-semibold text-primary mb-4 border-b border-foreground/5 pb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                href="/admin/appointments"
                className="w-full flex justify-between items-center bg-white border border-foreground/5 p-3 rounded-xl hover:border-primary/30 transition-all text-xs font-semibold"
              >
                <span>Manage Appointments</span>
                <span className="text-primary font-bold">→</span>
              </Link>
              <Link
                href="/admin/products"
                className="w-full flex justify-between items-center bg-white border border-foreground/5 p-3 rounded-xl hover:border-primary/30 transition-all text-xs font-semibold"
              >
                <span>Product Catalog CRUD</span>
                <span className="text-primary font-bold">→</span>
              </Link>
              <Link
                href="/admin/messages"
                className="w-full flex justify-between items-center bg-white border border-foreground/5 p-3 rounded-xl hover:border-primary/30 transition-all text-xs font-semibold"
              >
                <span>Read Client Enquiries</span>
                <span className="text-primary font-bold">→</span>
              </Link>
            </div>
          </div>

          <div className="border-t border-foreground/5 pt-4 mt-6 text-[10px] text-foreground/40 leading-relaxed">
            Clinic hours are active Mon-Sat, 10 AM to 7 PM. Use WhatsApp quick buttons on the appointment page to send rapid confirmation links.
          </div>
        </div>
      </div>
    </div>
  );
}

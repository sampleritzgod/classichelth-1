"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { API_ENDPOINTS } from "@/config";
import { useNotifications } from "@/context/NotificationContext";

interface DashboardStats {
  appointments: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    under_review: number;
    rescheduled: number;
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
    status: "pending" | "confirmed" | "completed" | "cancelled" | "under_review" | "rescheduled";
    createdAt: string;
  }>;
  dailyStats: Array<{
    date: string;
    count: number;
  }>;
  interventionQueue: Array<{
    _id: string;
    name: string;
    email: string;
    phone: string;
    date: string;
    timeSlot: string;
    service: string;
    status: string;
    interventionReason?: string;
  }>;
  interventionCount: number;
}

interface CapacityOverride {
  _id: string;
  service: string;
  date?: string;
  dayOfWeek?: number;
  timeSlot: string;
  capacity: number;
}

export default function AdminDashboard() {
  const { subscribe } = useNotifications();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "intervention" | "capacity">("overview");

  // Capacity states
  const [capacityOverrides, setCapacityOverrides] = useState<CapacityOverride[]>([]);
  const [capacityLoading, setCapacityLoading] = useState(false);
  const [newCapacity, setNewCapacity] = useState({
    service: "all",
    date: "",
    dayOfWeek: "",
    timeSlot: "09:00 AM",
    capacity: 2,
  });

  // Action states (for rescheduling in intervention queue)
  const [rescheduleTarget, setRescheduleTarget] = useState<any | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("09:00 AM");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API_ENDPOINTS.adminStats, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
        },
      });
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
  }, []);

  const fetchCapacityOverrides = async () => {
    try {
      setCapacityLoading(true);
      const res = await fetch(API_ENDPOINTS.adminCapacity, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        setCapacityOverrides(json.data);
      }
    } catch (err) {
      console.error("Error fetching capacity overrides:", err);
    } finally {
      setCapacityLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Live dashboard refresh on new/updated bookings (shared socket).
  useEffect(() => {
    const unsubscribers = [
      subscribe("admin_appointment_created", () => fetchStats()),
      subscribe("admin_appointment_updated", () => fetchStats()),
    ];
    return () => unsubscribers.forEach((off) => off());
  }, [subscribe, fetchStats]);

  useEffect(() => {
    if (activeSubTab === "capacity") {
      fetchCapacityOverrides();
    }
  }, [activeSubTab]);

  const handleCreateCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(API_ENDPOINTS.adminCapacity, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
        },
        body: JSON.stringify({
          ...newCapacity,
          dayOfWeek: newCapacity.dayOfWeek !== "" ? parseInt(newCapacity.dayOfWeek, 10) : null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNewCapacity({ service: "all", date: "", dayOfWeek: "", timeSlot: "09:00 AM", capacity: 2 });
        fetchCapacityOverrides();
      } else {
        alert(json.message || "Failed to save capacity override");
      }
    } catch (err) {
      console.error("Error saving capacity override:", err);
    }
  };

  const handleDeleteCapacity = async (id: string) => {
    if (!confirm("Are you sure you want to delete this capacity configuration?")) return;
    try {
      const res = await fetch(`${API_ENDPOINTS.adminCapacity}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        fetchCapacityOverrides();
      }
    } catch (err) {
      console.error("Error deleting capacity override:", err);
    }
  };

  const handleInterventionAction = async (id: string, status: string, options: any = {}) => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_ENDPOINTS.adminAppointments}/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
        },
        body: JSON.stringify({ status, ...options }),
      });
      const json = await res.json();
      if (json.success) {
        setRescheduleTarget(null);
        fetchStats();
      } else {
        alert(json.message || `Failed to update status to ${status}`);
      }
    } catch (err) {
      console.error("Error processing intervention:", err);
    } finally {
      setActionLoading(false);
    }
  };

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

  const getDOWName = (dow?: number) => {
    if (dow === undefined || dow === null) return "-";
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dow];
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-4">
        <div className="h-10 w-64 bg-foreground/10 rounded" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-foreground/5 rounded-2xl border border-foreground/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6 text-center m-4">
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

  const maxDailyBookings = Math.max(...stats.dailyStats.map((d) => d.count), 1);

  return (
    <div className="space-y-8 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight font-serif text-foreground">
            Clinic Control Center
          </h1>
          <p className="text-xs text-foreground/50 mt-1">
            Real-time automated scheduling, capacity configuration, and exception monitoring.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-accent-soft/20 p-1.5 rounded-full border border-foreground/5 w-fit self-start">
          <button
            onClick={() => setActiveSubTab("overview")}
            className={`px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              activeSubTab === "overview"
                ? "bg-primary text-white shadow-sm"
                : "text-foreground/80 hover:text-primary"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSubTab("intervention")}
            className={`px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer relative ${
              activeSubTab === "intervention"
                ? "bg-primary text-white shadow-sm"
                : "text-foreground/80 hover:text-primary"
            }`}
          >
            Intervention Queue
            {stats.interventionCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full text-[9px] h-4 w-4 flex items-center justify-center font-bold">
                {stats.interventionCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("capacity")}
            className={`px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              activeSubTab === "capacity"
                ? "bg-primary text-white shadow-sm"
                : "text-foreground/80 hover:text-primary"
            }`}
          >
            Capacity Control
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeSubTab === "overview" && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Today's Schedule */}
            <div className="bg-accent-soft/30 p-6 rounded-2xl border border-foreground/5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider block">
                  Today's Bookings
                </span>
                <span className="text-3xl font-serif text-primary font-bold mt-2 block">
                  {stats.appointments.today}
                </span>
              </div>
              <span className="text-[10px] text-foreground/40 mt-4 block">
                Automatically managed for today
              </span>
            </div>

            {/* Exceptional Actions */}
            <div className={`p-6 rounded-2xl border flex flex-col justify-between shadow-sm ${
              stats.interventionCount > 0 
                ? "bg-red-50/50 border-red-200" 
                : "bg-white border-foreground/5"
            }`}>
              <div>
                <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider block">
                  Interventions Needed
                </span>
                <span className={`text-3xl font-serif font-bold mt-2 block ${
                  stats.interventionCount > 0 ? "text-red-600 animate-pulse" : "text-foreground/80"
                }`}>
                  {stats.interventionCount}
                </span>
              </div>
              {stats.interventionCount > 0 ? (
                <button
                  onClick={() => setActiveSubTab("intervention")}
                  className="text-[10px] text-red-600 font-semibold hover:underline mt-4 text-left cursor-pointer"
                >
                  Solve exception cases →
                </button>
              ) : (
                <span className="text-[10px] text-foreground/40 mt-4 block">
                  All systems fully automated
                </span>
              )}
            </div>

            {/* Completed */}
            <div className="bg-white p-6 rounded-2xl border border-foreground/5 flex flex-col justify-between shadow-sm">
              <div>
                <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider block">
                  Completed Sessions
                </span>
                <span className="text-3xl font-serif text-green-700 font-bold mt-2 block">
                  {stats.appointments.completed}
                </span>
              </div>
              <span className="text-[10px] text-foreground/40 mt-4 block">
                Auto-completed by scheduler sweep
              </span>
            </div>

            {/* Unread Message Inbox */}
            <div className="bg-white p-6 rounded-2xl border border-foreground/5 flex flex-col justify-between shadow-sm">
              <div>
                <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider block">
                  Unread Inquiries
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

          {/* Grid Layout: Daily Density Graph & Recent Log */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Daily Booking Density Chart */}
            <div className="bg-white rounded-2xl border border-foreground/5 p-6 shadow-sm lg:col-span-2">
              <h2 className="text-base font-serif font-semibold text-primary mb-6 border-b border-foreground/5 pb-3">
                Daily Booking Density (Active last 7 days)
              </h2>
              
              <div className="flex items-end justify-between h-48 px-4 border-b border-foreground/5 pb-2">
                {stats.dailyStats.map((day, idx) => {
                  const percentage = (day.count / maxDailyBookings) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center group w-1/8">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold text-primary mb-1 bg-accent-soft/30 px-1.5 py-0.5 rounded">
                        {day.count}
                      </span>
                      <div 
                        style={{ height: `${Math.max(percentage, 5)}%` }}
                        className="w-full bg-primary hover:bg-primary-hover rounded-t-lg transition-all duration-300"
                      />
                      <span className="text-[9px] text-foreground/55 mt-2 font-medium">
                        {day.date}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center text-[9px] text-foreground/40 mt-3 px-4">
                <span>Total active appointments dynamically tracked: {stats.appointments.confirmed + stats.appointments.completed}</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary inline-block" /> Booking Density Scale: max={maxDailyBookings}</span>
              </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="bg-accent-soft/10 rounded-2xl border border-foreground/5 p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-serif font-semibold text-primary mb-4 border-b border-foreground/5 pb-3">
                  Workflow Statistics
                </h2>
                <div className="space-y-3.5 text-xs text-foreground/75">
                  <div className="flex justify-between">
                    <span>Confirmed bookings:</span>
                    <span className="font-semibold">{stats.appointments.confirmed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Under manual review:</span>
                    <span className="font-semibold text-accent-gold">{stats.appointments.under_review}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rescheduled:</span>
                    <span className="font-semibold">{stats.appointments.rescheduled}</span>
                  </div>
                  <div className="flex justify-between border-t border-foreground/5 pt-3">
                    <span>Completed therapies:</span>
                    <span className="font-semibold text-green-700">{stats.appointments.completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cancellations:</span>
                    <span className="font-semibold text-red-600">{stats.appointments.cancelled}</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-foreground/5 pt-4 mt-6 text-[10px] text-foreground/40 leading-relaxed">
                Automated scheduler sweep runs every 15 minutes, sending reminders and auto-completing elapsed bookings.
              </div>
            </div>
          </div>

          {/* Recent Bookings Feed */}
          <div className="bg-white rounded-2xl border border-foreground/5 p-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-foreground/5 pb-4 mb-4">
              <h2 className="text-lg font-serif font-semibold text-primary">
                Live Bookings Stream
              </h2>
              <Link href="/admin/appointments" className="text-xs font-semibold text-primary hover:underline">
                Manage all appointments
              </Link>
            </div>

            {stats.latestBookings.length === 0 ? (
              <p className="text-xs text-foreground/50 py-8 text-center">No bookings registered.</p>
            ) : (
              <div className="divide-y divide-foreground/5">
                {stats.latestBookings.map((booking) => (
                  <div key={booking._id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground font-serif">{booking.name}</h3>
                      <p className="text-xs text-foreground/50 mt-0.5">
                        {formatDate(booking.date)} at {booking.timeSlot} • {booking.condition || "General Assessment"}
                      </p>
                    </div>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        booking.status === "confirmed"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : booking.status === "completed"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : booking.status === "cancelled"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : booking.status === "under_review"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-gray-50 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {booking.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Intervention Queue Tab */}
      {activeSubTab === "intervention" && (
        <div className="space-y-6">
          <div className="bg-red-50/20 border border-red-200/50 rounded-2xl p-5">
            <h2 className="text-sm font-serif font-semibold text-red-800">⚠️ Active Exceptions Requiring Practitioner Review</h2>
            <p className="text-xs text-red-700/80 mt-1">
              These bookings require manual decisions (e.g. rescheduling conflicts, cancellation appeals, or custom patient conditions). All other bookings are confirmed automatically.
            </p>
          </div>

          {stats.interventionQueue.length === 0 ? (
            <div className="bg-white rounded-2xl border border-foreground/5 p-12 text-center text-foreground/60 shadow-sm">
              <span className="text-3xl block mb-2">🎉</span>
              <h3 className="text-sm font-semibold text-primary font-serif">Excellent! No Exceptions Found</h3>
              <p className="text-xs mt-1 max-w-sm mx-auto opacity-70">The system has automated 100% of current client schedules.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-foreground/5 overflow-hidden shadow-sm divide-y divide-foreground/5">
              {stats.interventionQueue.map((app) => (
                <div key={app._id} className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 hover:bg-accent-soft/5 transition-colors">
                  {/* Left: Info */}
                  <div className="space-y-2 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground font-serif">{app.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold border border-red-200">
                        {app.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-xs text-foreground/75 leading-relaxed">
                      <strong>Requested:</strong> {formatDate(app.date)} at <strong>{app.timeSlot}</strong> for <em>{app.service}</em>
                    </p>
                    
                    {app.interventionReason && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-2.5 text-xs font-semibold flex gap-1.5 items-start">
                        <span>💡</span>
                        <span>Reason: {app.interventionReason}</span>
                      </div>
                    )}

                    <div className="text-[10px] text-foreground/50 space-x-3 mt-1">
                      <span>✉️ {app.email}</span>
                      <span>📞 {app.phone}</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap gap-2.5 self-center">
                    <button
                      onClick={() => handleInterventionAction(app._id, "confirmed", { statusMessage: "Practitioner manually approved slot." })}
                      disabled={actionLoading}
                      className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Instant Confirm
                    </button>
                    <button
                      onClick={() => {
                        setRescheduleTarget(app);
                        setNewDate(app.date.slice(0, 10));
                        setNewTime(app.timeSlot);
                      }}
                      disabled={actionLoading}
                      className="border border-foreground/10 hover:border-primary hover:bg-primary/5 text-foreground px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Cancel this appointment? This sends a notification to the client.")) {
                          handleInterventionAction(app._id, "cancelled", { statusMessage: "Practitioner manually cancelled appointment." });
                        }
                      }}
                      disabled={actionLoading}
                      className="border border-red-100 hover:border-red-500 hover:bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Cancel Booking
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reschedule Dialogue Modal */}
          {rescheduleTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div onClick={() => setRescheduleTarget(null)} className="absolute inset-0 bg-foreground/30 backdrop-blur-xs" />
              <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-foreground/5 z-10 space-y-4">
                <h3 className="font-serif text-lg text-primary font-semibold">Reschedule Appointment</h3>
                <p className="text-xs text-foreground/60">Choose new schedule coordinates for <strong>{rescheduleTarget.name}</strong>.</p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-foreground mb-1">New Date</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full rounded-lg border border-foreground/15 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-foreground mb-1">New Time Slot</label>
                    <select
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full rounded-lg border border-foreground/15 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => handleInterventionAction(rescheduleTarget._id, "rescheduled", { date: newDate, timeSlot: newTime, statusMessage: `Practitioner rescheduled appointment to ${newDate} at ${newTime}.` })}
                    disabled={actionLoading || !newDate}
                    className="flex-1 bg-primary hover:bg-primary-hover text-white py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Confirm Reschedule
                  </button>
                  <button
                    onClick={() => setRescheduleTarget(null)}
                    className="flex-1 border border-foreground/10 py-2 rounded-xl text-xs font-semibold hover:bg-foreground/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Capacity Controls Tab */}
      {activeSubTab === "capacity" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Form: Add Capacity Override */}
          <div className="bg-white rounded-2xl border border-foreground/5 p-6 shadow-sm h-fit">
            <h2 className="text-base font-serif font-semibold text-primary mb-4 border-b border-foreground/5 pb-3">
              Configure Slot Override
            </h2>
            <form onSubmit={handleCreateCapacity} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Target Service Scope</label>
                <select
                  value={newCapacity.service}
                  onChange={(e) => setNewCapacity({ ...newCapacity, service: e.target.value })}
                  className="w-full rounded-lg border border-foreground/15 px-3 py-2 focus:outline-none bg-white"
                >
                  <option value="all">All Services (Global limit)</option>
                  <option value="Ayurvedic Consultation (Online)">Ayurvedic Consultation (Online)</option>
                  <option value="Nadi Parikshan (Pulse Diagnosis)">Nadi Parikshan (Pulse Diagnosis)</option>
                  <option value="Doorstep Health Checkup">Doorstep Health Checkup</option>
                  <option value="Diabetes Care Program">Diabetes Care Program</option>
                  <option value="Thyroid & PCOS Care">Thyroid & PCOS Care</option>
                  <option value="Weight & Obesity Management">Weight & Obesity Management</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Specific Date (Optional)</label>
                  <input
                    type="date"
                    value={newCapacity.date}
                    onChange={(e) => setNewCapacity({ ...newCapacity, date: e.target.value, dayOfWeek: "" })}
                    className="w-full rounded-lg border border-foreground/15 px-3 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Or Day of Week (Optional)</label>
                  <select
                    value={newCapacity.dayOfWeek}
                    onChange={(e) => setNewCapacity({ ...newCapacity, dayOfWeek: e.target.value, date: "" })}
                    className="w-full rounded-lg border border-foreground/15 px-3 py-2 focus:outline-none bg-white"
                  >
                    <option value="">Choose weekday</option>
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                    <option value="0">Sunday</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Time Slot</label>
                  <select
                    value={newCapacity.timeSlot}
                    onChange={(e) => setNewCapacity({ ...newCapacity, timeSlot: e.target.value })}
                    className="w-full rounded-lg border border-foreground/15 px-3 py-2 focus:outline-none bg-white"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Slot Capacity Limit</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    required
                    value={newCapacity.capacity}
                    onChange={(e) => setNewCapacity({ ...newCapacity, capacity: parseInt(e.target.value, 10) })}
                    className="w-full rounded-lg border border-foreground/15 px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                Apply Capacity Configuration
              </button>
            </form>
          </div>

          {/* List: Active capacity configurations */}
          <div className="bg-white rounded-2xl border border-foreground/5 p-6 shadow-sm lg:col-span-2">
            <h2 className="text-base font-serif font-semibold text-primary mb-4 border-b border-foreground/5 pb-3">
              Active Capacity Rules
            </h2>

            {capacityLoading ? (
              <p className="text-xs text-foreground/50 py-8 text-center">Loading rules...</p>
            ) : capacityOverrides.length === 0 ? (
              <p className="text-xs text-foreground/50 py-8 text-center">No overrides set. Using system default (2 per slot).</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left text-foreground/85 divide-y divide-foreground/5">
                  <thead>
                    <tr className="text-[10px] font-semibold text-foreground/50 uppercase">
                      <th className="py-3 px-2">Service</th>
                      <th className="py-3 px-2">Schedule Coordinates</th>
                      <th className="py-3 px-2 text-center">Capacity</th>
                      <th className="py-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-foreground/5">
                    {capacityOverrides.map((override) => (
                      <tr key={override._id} className="hover:bg-accent-soft/5">
                        <td className="py-3 px-2 font-medium">{override.service}</td>
                        <td className="py-3 px-2">
                          {override.date 
                            ? formatDate(override.date) 
                            : override.dayOfWeek !== null && override.dayOfWeek !== undefined
                            ? getDOWName(override.dayOfWeek)
                            : "Every Day"}
                          {" • "}
                          <strong>{override.timeSlot}</strong>
                        </td>
                        <td className="py-3 px-2 text-center font-bold">
                          {override.capacity === 0 ? (
                            <span className="text-red-600 bg-red-50 border border-red-100 rounded px-1.5 py-0.5">Blocked</span>
                          ) : (
                            override.capacity
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <button
                            onClick={() => handleDeleteCapacity(override._id)}
                            className="text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

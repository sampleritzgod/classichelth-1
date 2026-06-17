"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { API_ENDPOINTS } from "@/config";

interface Appointment {
  _id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  condition?: string;
  message?: string;
  status: "pending" | "under_review" | "confirmed" | "rescheduled" | "completed" | "cancelled";
  notes?: string;
  statusMessage?: string;
  service?: string;
  createdAt: string;
  statusHistory?: Array<{
    status: string;
    statusMessage: string;
    changedAt: string;
  }>;
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  appointment: string;
}

export default function ProfilePage() {
  const { user, loading, updateProfile } = useAuth();
  const { subscribe } = useNotifications();
  const router = useRouter();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<"appointments" | "settings" | "notifications">("appointments");

  // Profile Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Appointments & Notifications states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Initialize edit fields when user is loaded
  useEffect(() => {
    if (user) {
      setEditName(user?.name || "");
      setEditEmail(user?.email || "");
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [loading, user, router]);

  useEffect(() => {
    document.title = "My Dashboard | Classic Health";
  }, []);

  // Fetch User's Appointments
  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingAppointments(true);
      const token = localStorage.getItem("token") || "";
      const response = await fetch(API_ENDPOINTS.myAppointments, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load appointments");
      }

      const json = await response.json();
      if (json.success) {
        setAppointments(json.data);
        // If an appointment was selected, update it with fresh data
        if (selectedAppointment) {
          const updated = json.data.find((app: Appointment) => app._id === selectedAppointment._id);
          if (updated) {
            setSelectedAppointment(updated);
          }
        } else if (json.data.length > 0) {
          setSelectedAppointment(json.data[0]);
        }
      }
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoadingAppointments(false);
    }
  }, [user, selectedAppointment]);

  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingNotifications(true);
      const token = localStorage.getItem("token") || "";
      const response = await fetch(API_ENDPOINTS.notifications, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load notifications");
      }

      const json = await response.json();
      if (json.success) {
        setNotifications(json.data);
        setUnreadCount(json.unreadCount);
      }
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoadingNotifications(false);
    }
  }, [user]);

  // Load Initial Data
  useEffect(() => {
    if (user) {
      fetchAppointments();
      fetchNotifications();
    }
  }, [user, fetchAppointments, fetchNotifications]);

  // Real-time updates via the single shared socket (NotificationContext).
  // No separate socket connection is opened here.
  useEffect(() => {
    if (!user) return;

    const unsubscribers = [
      subscribe("appointment_updated", () => fetchAppointments()),
      subscribe("appointment_created", () => fetchAppointments()),
      subscribe("appointment_reminder", () => fetchAppointments()),
      subscribe("notifications_updated", () => fetchNotifications()),
    ];

    return () => {
      unsubscribers.forEach((off) => off());
    };
  }, [user, subscribe, fetchAppointments, fetchNotifications]);

  // Update Profile details
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

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const response = await fetch(API_ENDPOINTS.markAllNotificationsRead, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Mark single notification as read
  const handleMarkSingleRead = async (id: string) => {
    try {
      const token = localStorage.getItem("token") || "";
      const response = await fetch(`${API_ENDPOINTS.notifications}/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Helper date formatter
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Color mappings for badges
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "under_review":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "confirmed":
        return "bg-green-50 text-green-700 border-green-200";
      case "rescheduled":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-foreground/5 text-foreground/60 border-foreground/10";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace("_", " ").toUpperCase();
  };

  // Timeline stage mapping
  const timelineStages = [
    { key: "pending", label: "Request Submitted" },
    { key: "under_review", label: "Under Review" },
    { key: "confirmed", label: "Confirmed" },
    { key: "completed", label: "Completed" },
  ];

  const getStageIndex = (status: string) => {
    switch (status) {
      case "pending":
        return 0;
      case "under_review":
        return 1;
      case "confirmed":
      case "rescheduled":
        return 2;
      case "completed":
        return 3;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex-grow flex items-center justify-center bg-[#faf9f5] min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            <p className="text-xs text-foreground/50 font-serif">Loading your dashboard details...</p>
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
              You must be logged in to view your profile and appointments. You will be redirected to the home page shortly.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold uppercase tracking-wider py-3 px-6 rounded-full transition-all cursor-pointer"
            >
              Go to Home Page
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

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
      <main className="flex-grow bg-[#faf9f5] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-10 text-center animate-fade-up">
            <span className="h-2 w-2 rounded-full bg-accent-gold inline-block mr-2" />
            <span className="font-serif text-xs font-bold tracking-widest text-[#1e3f20] uppercase">
              Member Sanctuary
            </span>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              Wellness Portal
            </h1>
            <p className="mt-2 text-xs text-foreground/60">
              Review your appointment lifecycles, read therapist updates, and manage settings.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 mt-10">
            {/* Tabs Navigation Sidebar */}
            <div className="lg:w-1/4 flex flex-row lg:flex-col gap-2 bg-white border border-foreground/5 p-4 rounded-3xl shadow-sm h-fit">
              <button
                onClick={() => setActiveTab("appointments")}
                className={`flex-1 lg:flex-initial text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                  activeTab === "appointments"
                    ? "bg-primary text-white"
                    : "text-foreground/70 hover:bg-foreground/5"
                }`}
              >
                <span>My Appointments</span>
                {appointments.length > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeTab === "appointments" ? "bg-white/20 text-white" : "bg-foreground/5 text-foreground/60"
                  }`}>
                    {appointments.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("notifications")}
                className={`flex-1 lg:flex-initial text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                  activeTab === "notifications"
                    ? "bg-primary text-white"
                    : "text-foreground/70 hover:bg-foreground/5"
                }`}
              >
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`flex-1 lg:flex-initial text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "settings"
                    ? "bg-primary text-white"
                    : "text-foreground/70 hover:bg-foreground/5"
                }`}
              >
                Profile Settings
              </button>
            </div>

            {/* Tab Contents */}
            <div className="lg:w-3/4">
              {/* Tab 1: Appointments */}
              {activeTab === "appointments" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Appointments List */}
                  <div className="md:col-span-1 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <h3 className="font-serif text-sm font-bold text-primary mb-2">My Bookings</h3>
                    {loadingAppointments && appointments.length === 0 ? (
                      <div className="text-center py-6 text-xs text-foreground/50">Loading appointments...</div>
                    ) : appointments.length === 0 ? (
                      <div className="text-center py-8 px-4 bg-white border border-foreground/5 rounded-3xl">
                        <p className="text-xs text-foreground/50 leading-relaxed mb-4">No appointments scheduled.</p>
                        <button
                          onClick={() => router.push("/#booking")}
                          className="bg-primary hover:bg-primary-hover text-white text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-full transition-all cursor-pointer"
                        >
                          Book Now
                        </button>
                      </div>
                    ) : (
                      appointments.map((app) => (
                        <div
                          key={app._id}
                          onClick={() => setSelectedAppointment(app)}
                          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                            selectedAppointment?._id === app._id
                              ? "bg-white border-primary shadow-sm ring-1 ring-primary/20"
                              : "bg-white border-foreground/5 hover:border-foreground/15"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold tracking-wide text-foreground/50 uppercase truncate max-w-[120px]">
                              {app.service || "Wellness Session"}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${getStatusBadgeClass(app.status)}`}>
                              {formatStatus(app.status)}
                            </span>
                          </div>
                          <h4 className="font-serif text-sm font-semibold text-foreground truncate">{app.name}</h4>
                          <p className="text-[10px] text-foreground/50 mt-1">{formatDate(app.date)} • {app.timeSlot}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Right Column: Appointment Details & Timeline */}
                  <div className="md:col-span-2">
                    {selectedAppointment ? (
                      <div className="bg-white border border-foreground/5 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                        {/* Title Header */}
                        <div className="border-b border-foreground/5 pb-4">
                          <div className="flex flex-wrap justify-between items-center gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">
                                Service File
                              </span>
                              <h3 className="font-serif text-xl font-bold text-foreground">
                                {selectedAppointment.service || "General Wellness Consultation"}
                              </h3>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(selectedAppointment.status)}`}>
                              {formatStatus(selectedAppointment.status)}
                            </span>
                          </div>
                          <p className="text-[10px] text-foreground/40 mt-1">ID: {selectedAppointment._id}</p>
                        </div>

                        {/* Booking Details Grid */}
                        <div className="grid grid-cols-2 gap-4 text-left text-xs border-b border-foreground/5 pb-6">
                          <div>
                            <span className="block text-[10px] font-bold text-foreground/40 uppercase tracking-wider mb-1">
                              Patient Name
                            </span>
                            <span className="font-medium text-foreground">{selectedAppointment.name}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold text-foreground/40 uppercase tracking-wider mb-1">
                              Date & Time
                            </span>
                            <span className="font-medium text-foreground">
                              {formatDate(selectedAppointment.date)} ({selectedAppointment.timeSlot})
                            </span>
                          </div>
                          {selectedAppointment.condition && (
                            <div className="col-span-2">
                              <span className="block text-[10px] font-bold text-foreground/40 uppercase tracking-wider mb-1">
                                Symptom / Reason for Booking
                              </span>
                              <span className="font-medium text-foreground">{selectedAppointment.condition}</span>
                            </div>
                          )}
                        </div>

                        {/* Rescheduled and Cancelled Alerts */}
                        {selectedAppointment.status === "cancelled" && (
                          <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-xs text-left leading-relaxed">
                            <strong className="block font-bold mb-1">⚠️ Appointment Cancelled</strong>
                            {selectedAppointment.statusMessage || "This appointment has been cancelled by the administrative panel. Please contact support or book a new session."}
                          </div>
                        )}

                        {selectedAppointment.status === "rescheduled" && (
                          <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-2xl p-4 text-xs text-left leading-relaxed">
                            <strong className="block font-bold mb-1">🕒 Appointment Rescheduled</strong>
                            This appointment has been rescheduled.
                            <div className="mt-2 pl-2 border-l-2 border-orange-300 font-medium">
                              New Date: {formatDate(selectedAppointment.date)} ({selectedAppointment.timeSlot})
                            </div>
                            {selectedAppointment.statusMessage && (
                              <div className="mt-2 text-foreground/80 italic">
                                Remarks: "{selectedAppointment.statusMessage}"
                              </div>
                            )}
                          </div>
                        )}

                        {/* Status Remarks (General) */}
                        {selectedAppointment.statusMessage && selectedAppointment.status !== "cancelled" && selectedAppointment.status !== "rescheduled" && (
                          <div className="bg-foreground/[0.02] border border-foreground/5 rounded-2xl p-4 text-xs text-left leading-relaxed">
                            <strong className="block font-semibold text-primary mb-1">Practitioner Remarks</strong>
                            <p className="text-foreground/70">"{selectedAppointment.statusMessage}"</p>
                          </div>
                        )}

                        {/* Progress Stepper Timeline */}
                        {selectedAppointment.status !== "cancelled" && (
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold text-primary uppercase tracking-wider text-left">Progress Timeline</h4>
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-y-6 gap-x-2 bg-foreground/[0.01] border border-foreground/5 p-6 rounded-3xl">
                              {timelineStages.map((stage, idx) => {
                                const currentIdx = getStageIndex(selectedAppointment.status);
                                const isCompleted = idx <= currentIdx;
                                const isCurrent = idx === currentIdx;

                                return (
                                  <div key={stage.key} className="flex flex-row sm:flex-col items-center gap-3 sm:text-center w-full sm:flex-1 relative">
                                    {/* Line connecting nodes */}
                                    {idx < timelineStages.length - 1 && (
                                      <div className={`hidden sm:block absolute top-4 left-[50%] right-[-50%] h-[2px] z-0 transition-colors ${
                                        idx < currentIdx ? "bg-green-500" : "bg-foreground/10"
                                      }`} />
                                    )}

                                    {/* Stepper Node Bubble */}
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border z-10 transition-all ${
                                      isCompleted
                                        ? "bg-green-500 text-white border-green-500 shadow-sm"
                                        : "bg-white text-foreground/30 border-foreground/15"
                                    } ${isCurrent ? "ring-4 ring-green-500/20 animate-pulse" : ""}`}>
                                      {isCompleted ? "✓" : idx + 1}
                                    </div>

                                    {/* Label */}
                                    <span className={`text-[10px] font-semibold tracking-wide ${
                                      isCompleted ? "text-foreground font-bold" : "text-foreground/40"
                                    }`}>
                                      {stage.key === "confirmed" && selectedAppointment.status === "rescheduled"
                                        ? "Rescheduled"
                                        : stage.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Status history log details */}
                        {selectedAppointment.statusHistory && selectedAppointment.statusHistory.length > 0 && (
                          <div className="space-y-3 pt-2">
                            <h4 className="text-xs font-bold text-primary uppercase tracking-wider text-left">Activity Log</h4>
                            <div className="border-l border-foreground/10 pl-4 space-y-4 text-left">
                              {selectedAppointment.statusHistory.map((hist, index) => (
                                <div key={index} className="relative">
                                  {/* Dot */}
                                  <div className="absolute top-1 -left-[21px] h-2.5 w-2.5 rounded-full bg-primary border-2 border-white" />
                                  <div className="text-xs">
                                    <span className="font-semibold text-foreground">{formatStatus(hist.status)}</span>
                                    <span className="text-[10px] text-foreground/40 ml-2">
                                      {new Date(hist.changedAt).toLocaleString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                    {hist.statusMessage && (
                                      <p className="text-[10px] text-foreground/60 mt-0.5 leading-relaxed">
                                        {hist.statusMessage}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white border border-foreground/5 rounded-3xl p-10 text-center shadow-xs">
                        <p className="text-xs text-foreground/50">Select an appointment to inspect its live status lifecycle.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Settings */}
              {activeTab === "settings" && (
                <div className="bg-white border border-foreground/5 rounded-3xl p-6 sm:p-10 shadow-sm max-w-2xl mx-auto">
                  {editError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-xs font-semibold leading-relaxed mb-6 text-center">
                      ⚠️ {editError}
                    </div>
                  )}
                  {editSuccess && (
                    <div className="bg-[#e8f5e9] border border-[#a5d6a7] text-[#2e7d32] rounded-2xl p-4 text-xs font-semibold leading-relaxed mb-6 text-center">
                      ✓ {editSuccess}
                    </div>
                  )}

                  {!isEditing ? (
                    <div className="space-y-8 text-left">
                      <div className="flex items-center gap-6 pb-6 border-b border-foreground/5">
                        <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl shadow-sm border border-primary/5">
                          {(user?.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <h2 className="font-serif text-xl font-semibold text-foreground">{user?.name || "User"}</h2>
                          <span className="inline-block bg-[#e8f5e9] text-[#2e7d32] text-[9px] font-bold tracking-wider px-3 py-1 rounded-full uppercase">
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
                          className="bg-[#1e3f20] hover:bg-[#1e3f20]/90 text-white text-xs font-semibold uppercase tracking-wider py-3 px-6 rounded-full transition-all duration-300 shadow-sm cursor-pointer"
                        >
                          Edit Profile Details
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateProfile} className="space-y-6 text-left">
                      <div className="flex justify-between items-center pb-4 border-b border-foreground/5">
                        <h3 className="font-serif text-base font-semibold text-foreground">
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
                          className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold uppercase tracking-wider py-3 px-6 rounded-full transition-all duration-300 disabled:opacity-50 shadow-sm cursor-pointer"
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
              )}

              {/* Tab 3: Notifications */}
              {activeTab === "notifications" && (
                <div className="bg-white border border-foreground/5 rounded-3xl p-6 sm:p-8 shadow-sm max-w-2xl mx-auto space-y-6">
                  <div className="flex justify-between items-center border-b border-foreground/5 pb-4">
                    <h3 className="font-serif text-lg font-bold text-primary">In-App Inbox</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-bold text-primary hover:text-primary-hover uppercase tracking-wider border border-primary/20 rounded-full px-4 py-1.5 hover:bg-primary/5 transition-all cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {loadingNotifications && notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-foreground/50">Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-xs text-foreground/50">Inbox is empty. Status update logs will appear here.</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => {
                            if (!n.isRead) handleMarkSingleRead(n._id);
                            // Also select the associated appointment and switch tab
                            const matchedApp = appointments.find((a) => a._id === n.appointment);
                            if (matchedApp) {
                              setSelectedAppointment(matchedApp);
                              setActiveTab("appointments");
                            }
                          }}
                          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all relative ${
                            n.isRead
                              ? "bg-foreground/[0.01] border-foreground/5 text-foreground/60"
                              : "bg-white border-primary/20 shadow-xs hover:border-primary/40 text-foreground font-medium"
                          }`}
                        >
                          {/* Unread Indicator dot */}
                          {!n.isRead && (
                            <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-red-500" />
                          )}
                          <h4 className="text-xs font-semibold text-foreground pr-4">{n.title}</h4>
                          <p className="text-[10px] text-foreground/70 mt-1 leading-relaxed">{n.message}</p>
                          <span className="block text-[8px] text-foreground/40 mt-2">
                            {new Date(n.createdAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

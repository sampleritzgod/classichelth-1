"use client";

import React, { useEffect, useState, useCallback } from "react";
import { API_ENDPOINTS } from "@/config";
import { getWhatsAppUrl } from "@/utils/whatsapp";

interface Appointment {
  _id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  condition?: string;
  message?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");

  // Notification Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Deletion confirmation modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Trigger Toast helper
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch appointments with query filters
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query string parameters
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (status && status !== "all") params.append("status", status);
      if (sort) params.append("sort", sort);

      const response = await fetch(`${API_ENDPOINTS.adminAppointments}?${params.toString()}`, {
        headers: {
          // Prepared Auth header (bypassed on backend for now)
          Authorization: "Bearer mock_token",
        },
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      if (json.success) {
        setAppointments(json.data);
      } else {
        throw new Error(json.message || "Failed to load appointments");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while fetching appointments.");
    } finally {
      setLoading(false);
    }
  }, [search, status, sort]);

  useEffect(() => {
    // Debounce search slightly to avoid excessive API hits
    const delayDebounceFn = setTimeout(() => {
      fetchAppointments();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, status, sort, fetchAppointments]);

  // Update Status handler
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.adminAppointments}/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock_token",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await response.json();
      if (response.ok && json.success) {
        showToast(`Appointment status updated to ${newStatus}`);
        // Update local state dynamically
        setAppointments((prev) =>
          prev.map((app) => (app._id === id ? { ...app, status: newStatus as any } : app))
        );
      } else {
        throw new Error(json.message || "Failed to update status");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update appointment status", "error");
    }
  };

  // Delete appointment handler
  const handleDeleteAppointment = async (id: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.adminAppointments}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer mock_token",
        },
      });

      const json = await response.json();
      if (response.ok && json.success) {
        showToast("Appointment deleted successfully");
        setAppointments((prev) => prev.filter((app) => app._id !== id));
      } else {
        throw new Error(json.message || "Failed to delete appointment");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to delete appointment", "error");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Build country-code corrected phone for WhatsApp link
  const getWhatsAppMessageLink = (booking: Appointment) => {
    let rawPhone = booking.phone.replace(/[^0-9]/g, "");
    if (rawPhone.length === 10) {
      rawPhone = "91" + rawPhone; // Default Indian country code prefix
    }

    let msg = "";
    const formattedDate = new Date(booking.date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    if (booking.status === "confirmed") {
      msg = `Hello ${booking.name}, your wellness session at U 1st Creation scheduled for ${formattedDate} at ${booking.timeSlot} is confirmed. We look forward to welcoming you!`;
    } else if (booking.status === "completed") {
      msg = `Hello ${booking.name}, thank you for visiting U 1st Creation today. We hope you had a relaxing therapy session. We'd love to hear your feedback!`;
    } else if (booking.status === "cancelled") {
      msg = `Hello ${booking.name}, your appointment on ${formattedDate} at ${booking.timeSlot} has been cancelled. Please let us know if you wish to reschedule.`;
    } else {
      msg = `Hello ${booking.name}, thank you for booking a wellness consultation with U 1st Creation. We are reviewing your request for ${formattedDate} at ${booking.timeSlot} and will confirm it shortly.`;
    }

    return getWhatsAppUrl(msg, rawPhone);
  };

  const formatDate = (dateStr: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      };
      return new Date(dateStr).toLocaleDateString("en-US", options);
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
            Appointments Board
          </h1>
          <p className="text-xs text-foreground/50 mt-1">
            Manage scheduled consultations, change booking statuses, and notify patients via WhatsApp.
          </p>
        </div>

        <button
          onClick={fetchAppointments}
          disabled={loading}
          className="mt-4 sm:mt-0 inline-flex items-center justify-center rounded-full border border-primary px-5 py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 cursor-pointer disabled:opacity-50 transition-all shadow-xs"
        >
          {loading ? "Refreshing..." : "Refresh Board"}
        </button>
      </div>

      {/* Filters board */}
      <div className="bg-white rounded-2xl border border-foreground/5 p-6 shadow-xs grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">
            Search Patient
          </label>
          <input
            type="text"
            id="search"
            placeholder="Search by name, email, phone, symptom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="statusFilter" className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">
            Filter Status
          </label>
          <select
            id="statusFilter"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all cursor-pointer"
          >
            <option value="all">All Booking States</option>
            <option value="pending">Pending Approval</option>
            <option value="confirmed">Confirmed Sessions</option>
            <option value="completed">Completed Therapies</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Sorting */}
        <div>
          <label htmlFor="sortFilter" className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">
            Sort Order
          </label>
          <select
            id="sortFilter"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all cursor-pointer"
          >
            <option value="newest">Booking Request: Newest First</option>
            <option value="oldest">Booking Request: Oldest First</option>
            <option value="dateAsc">Appointment Date: Ascending</option>
            <option value="dateDesc">Appointment Date: Descending</option>
          </select>
        </div>
      </div>

      {/* Main Board Table */}
      <div className="bg-white rounded-2xl border border-foreground/5 shadow-xs overflow-hidden">
        {loading && appointments.length === 0 ? (
          /* Loading Skeletons */
          <div className="p-8 space-y-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-foreground/5 pb-4 last:border-0 last:pb-0 animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-foreground/10 rounded" />
                  <div className="h-3 w-60 bg-foreground/5 rounded" />
                </div>
                <div className="mt-2 sm:mt-0 h-8 w-24 bg-foreground/10 rounded-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 font-semibold">{error}</div>
        ) : appointments.length === 0 ? (
          <div className="p-16 text-center">
            <span className="text-4xl block mb-4">📅</span>
            <h3 className="font-serif text-lg font-medium text-foreground mb-1">
              No matching appointments found.
            </h3>
            <p className="text-xs text-foreground/50 max-w-sm mx-auto">
              Try adjusting your active searches or status filters to find records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-foreground/10 bg-accent-soft/40">
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-foreground/75">
                    Patient / Contact
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-foreground/75">
                    Condition & Message
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-foreground/75">
                    Schedule Slot
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
                {appointments.map((booking) => (
                  <tr key={booking._id} className="hover:bg-accent-soft/10 transition-colors">
                    {/* Patient Column */}
                    <td className="py-5 px-6">
                      <div className="font-serif text-base font-semibold text-foreground">
                        {booking.name}
                      </div>
                      <div className="text-xs text-foreground/50 mt-0.5">{booking.email}</div>
                      <div className="text-xs text-foreground/50 mt-0.5 font-mono">{booking.phone}</div>
                    </td>

                    {/* Condition/Msg Column */}
                    <td className="py-5 px-6">
                      {booking.condition ? (
                        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-primary/5 text-primary border border-primary/10">
                          {booking.condition}
                        </span>
                      ) : (
                        <span className="text-xs text-foreground/40 italic">General Consultation</span>
                      )}
                      {booking.message && (
                        <p className="text-xs text-foreground/75 mt-1.5 max-w-xs line-clamp-2 italic">
                          "{booking.message}"
                        </p>
                      )}
                    </td>

                    {/* Schedule Column */}
                    <td className="py-5 px-6">
                      <div className="text-sm font-semibold text-foreground">
                        {formatDate(booking.date)}
                      </div>
                      <div className="text-xs text-foreground/50 mt-0.5">
                        Slot: {booking.timeSlot}
                      </div>
                    </td>

                    {/* Status Badge Dropdown */}
                    <td className="py-5 px-6">
                      <select
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider border focus:outline-none cursor-pointer transition-all ${
                          booking.status === "confirmed"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : booking.status === "completed"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : booking.status === "cancelled"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Actions Column */}
                    <td className="py-5 px-6 text-right space-x-3">
                      {/* WhatsApp Notify */}
                      <a
                        href={getWhatsAppMessageLink(booking)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-all"
                        title="Send Status Notification to Patient"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.993L2 22l5.233-1.371a9.919 9.919 0 0 0 4.777 1.224h.005c5.505 0 9.99-4.478 9.99-9.985 0-2.67-1.037-5.18-2.92-7.062C17.18 3.037 14.673 2 12.012 2zm5.727 14.128c-.25.703-1.46 1.282-1.996 1.343-.493.056-.995.27-3.13-.578-2.724-1.082-4.49-3.842-4.626-4.02-.136-.18-1.096-1.455-1.096-2.775 0-1.32.693-1.966.943-2.228.25-.262.545-.328.727-.328.182 0 .364.002.523.01.168.008.393-.063.614.47.228.55.773 1.884.84 2.018.069.135.114.293.023.473-.09.18-.136.293-.273.45-.136.16-.285.358-.409.48-.136.136-.28.285-.12.56.16.273.708 1.168 1.522 1.89.16.14.3.26.45.33.15.07.29.08.4.06.11-.02.36-.145.45-.33.1-.18.23-.42.34-.63.11-.21.23-.18.39-.12.16.06 1.046.49 1.228.58.18.09.3.135.34.208.046.073.046.42-.204 1.123z" />
                        </svg>
                      </a>

                      {/* Delete Action */}
                      <button
                        onClick={() => setDeleteConfirmId(booking._id)}
                        className="inline-flex items-center justify-center p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer"
                        title="Delete Record"
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

      {/* Confirmation modal for delete */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setDeleteConfirmId(null)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-xs"
          />
          <div className="relative bg-background p-6 rounded-2xl border border-foreground/5 shadow-xl max-w-sm w-full z-10 animate-fade-up">
            <h3 className="font-serif text-lg font-semibold text-primary mb-2">Delete Booking?</h3>
            <p className="text-xs text-foreground/60 leading-relaxed mb-6">
              Are you sure you want to permanently delete this appointment record? This action cannot be undone.
            </p>
            <div className="flex gap-x-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-foreground/15 rounded-full text-xs font-semibold text-foreground/80 hover:bg-foreground/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAppointment(deleteConfirmId)}
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

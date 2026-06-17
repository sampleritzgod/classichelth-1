"use client";

import React, { useEffect, useState, useCallback } from "react";
import { API_ENDPOINTS } from "@/config";
import { getWhatsAppUrl, openWhatsApp, WHATSAPP_TEMPLATES } from "@/utils/whatsapp";

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
}

const CLINIC_SERVICES = [
  "General Wellness Consultation",
  "Acupuncture & Holistic Therapy",
  "Nutrition & Dietary Guidance",
  "Stress Management & Meditation",
  "Physical Rehab & Chiropractice",
];

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  // Notification Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modals state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Detail Modal Form state
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    phone: string;
    date: string;
    timeSlot: string;
    condition: string;
    message: string;
    service: string;
    status: "pending" | "under_review" | "confirmed" | "rescheduled" | "completed" | "cancelled";
    notes: string;
    statusMessage: string;
  } | null>(null);

  const [savingDetails, setSavingDetails] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [whatsappTemplate, setWhatsappTemplate] = useState<"confirmed" | "cancelled" | "completed" | "followup" | "consultation" | "product">("confirmed");
  const [whatsappText, setWhatsappText] = useState("");
  const [productNameInput, setProductNameInput] = useState("Ayurvedic wellness formula");

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
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
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
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await response.json();
      if (response.ok && json.success) {
        showToast(`Appointment status updated to ${newStatus}`);
        setAppointments((prev) =>
          prev.map((app) => (app._id === id ? { ...app, status: newStatus as any } : app))
        );
        if (selectedAppointment?._id === id) {
          setSelectedAppointment((prev) => prev ? { ...prev, status: newStatus as any } : null);
          setEditForm((prev) => prev ? { ...prev, status: newStatus as any } : null);
        }
      } else {
        throw new Error(json.message || "Failed to update status");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update appointment status", "error");
    }
  };

  // Helper to generate template text dynamically
  const generateWhatsAppMessageText = (booking: Appointment, type: string, productName: string = "Ayurvedic wellness formula") => {
    const formattedDate = new Date(booking.date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const serviceName = booking.service || "General Wellness Consultation";

    if (type === "followup") {
      return WHATSAPP_TEMPLATES.followUpReminder(booking.name);
    } else if (type === "consultation") {
      return WHATSAPP_TEMPLATES.consultationReminder(booking.name, formattedDate, booking.timeSlot, serviceName);
    } else if (type === "product") {
      return WHATSAPP_TEMPLATES.productInquiryResponse(booking.name, productName);
    } else if (type === "confirmed") {
      return WHATSAPP_TEMPLATES.appointmentConfirmed(booking.name, formattedDate, booking.timeSlot, serviceName);
    } else if (type === "cancelled") {
      return WHATSAPP_TEMPLATES.appointmentCancelled(booking.name, formattedDate, booking.timeSlot, serviceName);
    } else if (type === "completed") {
      return WHATSAPP_TEMPLATES.appointmentCompleted(booking.name, serviceName);
    } else {
      return `Hello ${booking.name}, thank you for booking a wellness consultation with U 1st Creation. We are reviewing your request for ${formattedDate} at ${booking.timeSlot} and will confirm it shortly.`;
    }
  };

  // Change active template in UI
  const handleTemplateChange = (type: string, productName: string = "Ayurvedic wellness formula") => {
    setWhatsappTemplate(type as any);
    if (selectedAppointment) {
      const generated = generateWhatsAppMessageText(selectedAppointment, type, productName);
      setWhatsappText(generated);
    }
  };

  // Handle DB status change + immediate WhatsApp Click-to-Chat trigger (Confirm & WhatsApp / Cancel & WhatsApp)
  const handleStatusAndWhatsApp = async (id: string, newStatus: "confirmed" | "cancelled" | "completed") => {
    try {
      const response = await fetch(`${API_ENDPOINTS.adminAppointments}/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await response.json();
      if (response.ok && json.success) {
        showToast(`Appointment status updated to ${newStatus}`);
        setAppointments((prev) =>
          prev.map((app) => (app._id === id ? { ...app, status: newStatus } : app))
        );
        if (selectedAppointment?._id === id) {
          setSelectedAppointment(json.data);
          setEditForm((prev) => prev ? { ...prev, status: newStatus } : null);
        }

        // Generate the template text for this status
        const msg = generateWhatsAppMessageText(json.data, newStatus);
        setWhatsappText(msg);
        setWhatsappTemplate(newStatus as any);

        // Open WhatsApp targeting the customer's phone number
        openWhatsApp(msg, json.data.phone);
      } else {
        throw new Error(json.message || "Failed to update status");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update status & WhatsApp", "error");
    }
  };

  // Open Details Modal & Init edit state
  const openDetailsModal = (booking: Appointment) => {
    setSelectedAppointment(booking);
    
    // Format date for <input type="date"> (YYYY-MM-DD)
    let formattedDate = "";
    try {
      formattedDate = new Date(booking.date).toISOString().split("T")[0];
    } catch (e) {
      formattedDate = booking.date;
    }

    setEditForm({
      name: booking.name || "",
      email: booking.email || "",
      phone: booking.phone || "",
      date: formattedDate,
      timeSlot: booking.timeSlot || "",
      condition: booking.condition || "",
      message: booking.message || "",
      service: booking.service || "General Wellness Consultation",
      status: booking.status || "pending",
      notes: booking.notes || "",
      statusMessage: booking.statusMessage || "",
    });

    // Default template text based on current status
    const defaultTemplateType = booking.status === "pending" ? "confirmed" : booking.status;
    setWhatsappTemplate(defaultTemplateType as any);
    const initialText = generateWhatsAppMessageText(booking, defaultTemplateType);
    setWhatsappText(initialText);
  };

  // Submit PUT changes
  const handleSaveChanges = async () => {
    if (!selectedAppointment || !editForm) return;

    try {
      setSavingDetails(true);
      const response = await fetch(`${API_ENDPOINTS.adminAppointments}/${selectedAppointment._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
        },
        body: JSON.stringify(editForm),
      });

      const json = await response.json();
      if (response.ok && json.success) {
        showToast("Appointment details updated successfully");
        // Update local state
        setAppointments((prev) =>
          prev.map((app) => (app._id === selectedAppointment._id ? json.data : app))
        );
        setSelectedAppointment(json.data);
      } else {
        throw new Error(json.message || "Failed to update details");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save appointment modifications", "error");
    } finally {
      setSavingDetails(false);
    }
  };

  // Manually Resend Email
  const handleResendEmail = async () => {
    if (!selectedAppointment) return;

    try {
      setSendingEmail(true);
      const response = await fetch(`${API_ENDPOINTS.adminAppointments}/${selectedAppointment._id}/notify-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
        },
      });

      const json = await response.json();
      if (response.ok && json.success) {
        showToast(`Confirmation email successfully sent to ${selectedAppointment.email}`);
      } else {
        throw new Error(json.message || "Failed to transmit manual email");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to send email notification", "error");
    } finally {
      setSendingEmail(false);
    }
  };

  // Delete appointment handler
  const handleDeleteAppointment = async (id: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.adminAppointments}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || "mock_token"}`,
        },
      });

      const json = await response.json();
      if (response.ok && json.success) {
        showToast("Appointment deleted successfully");
        setAppointments((prev) => prev.filter((app) => app._id !== id));
        setSelectedAppointment(null);
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
  const getWhatsAppMessageLink = (booking: Appointment, type: "status" | "followup" | "general" = "status") => {
    let rawPhone = booking.phone.replace(/[^0-9]/g, "");
    if (rawPhone.length === 10) {
      rawPhone = "91" + rawPhone; // Default Indian country code prefix
    }

    const formattedDate = new Date(booking.date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    let msg = "";
    if (type === "followup") {
      msg = WHATSAPP_TEMPLATES.followUpReminder(booking.name);
    } else if (type === "general") {
      msg = `Hello ${booking.name}, this is U 1st Creation Wellness Clinic. We are reaching out to follow up on your wellness inquiry. Let us know how we can assist you!`;
    } else {
      // status templates
      const serviceName = booking.service || "Wellness Consultation";
      if (booking.status === "confirmed") {
        msg = WHATSAPP_TEMPLATES.appointmentConfirmed(booking.name, formattedDate, booking.timeSlot, serviceName);
      } else if (booking.status === "completed") {
        msg = WHATSAPP_TEMPLATES.appointmentCompleted(booking.name, serviceName);
      } else if (booking.status === "cancelled") {
        msg = WHATSAPP_TEMPLATES.appointmentCancelled(booking.name, formattedDate, booking.timeSlot, serviceName);
      } else {
        msg = `Hello ${booking.name}, thank you for booking a wellness consultation with U 1st Creation. We are reviewing your request for ${formattedDate} at ${booking.timeSlot} and will confirm it shortly.`;
      }
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

  // Compute stats locally from all fetched appointments
  const totalCounts = appointments.length;
  const pendingCounts = appointments.filter((a) => a.status === "pending").length;
  const confirmedCounts = appointments.filter((a) => a.status === "confirmed").length;
  const completedCounts = appointments.filter((a) => a.status === "completed").length;

  // Filter list by selected service
  const filteredAppointments = appointments.filter((booking) => {
    if (serviceFilter === "all") return true;
    return (booking.service || "General Wellness Consultation").toLowerCase() === serviceFilter.toLowerCase();
  });

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
            Manage scheduled consultations, change booking statuses, write clinical logs, and notify patients.
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

      {/* Stats Counter Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-foreground/5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-foreground/40 block">Total Boarded</span>
          <span className="text-2xl font-bold text-foreground font-serif block mt-1">{totalCounts}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-foreground/5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-600 block">Pending Review</span>
          <span className="text-2xl font-bold text-amber-700 font-serif block mt-1">{pendingCounts}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-foreground/5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-green-600 block">Confirmed Sessions</span>
          <span className="text-2xl font-bold text-green-700 font-serif block mt-1">{confirmedCounts}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-foreground/5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-blue-600 block">Completed Therapies</span>
          <span className="text-2xl font-bold text-blue-700 font-serif block mt-1">{completedCounts}</span>
        </div>
      </div>

      {/* Filters board */}
      <div className="bg-white rounded-2xl border border-foreground/5 p-6 shadow-xs grid grid-cols-1 gap-4 sm:grid-cols-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">
            Search Patient
          </label>
          <input
            type="text"
            id="search"
            placeholder="Search name, phone, symptom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-2.5 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
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
            className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-2.5 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all cursor-pointer"
          >
            <option value="all">All Booking States</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="confirmed">Confirmed</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Service Filter */}
        <div>
          <label htmlFor="serviceFilter" className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">
            Filter Service
          </label>
          <select
            id="serviceFilter"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-2.5 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all cursor-pointer"
          >
            <option value="all">All Service Categories</option>
            {CLINIC_SERVICES.map((srv) => (
              <option key={srv} value={srv}>{srv}</option>
            ))}
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
            className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-2.5 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all cursor-pointer"
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
        {loading && filteredAppointments.length === 0 ? (
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
        ) : filteredAppointments.length === 0 ? (
          <div className="p-16 text-center">
            <span className="text-4xl block mb-4">📅</span>
            <h3 className="font-serif text-lg font-medium text-foreground mb-1">
              No matching appointments found.
            </h3>
            <p className="text-xs text-foreground/50 max-w-sm mx-auto">
              Try adjusting your active searches, service types or status filters to find records.
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
                    Assigned Service & Concern
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
              <tbody className="divide-y divide-foreground/5 text-xs">
                {filteredAppointments.map((booking) => (
                  <tr key={booking._id} className="hover:bg-accent-soft/10 transition-colors">
                    {/* Patient Column */}
                    <td className="py-5 px-6">
                      <div className="font-serif text-sm font-semibold text-foreground font-semibold">
                        {booking.name}
                      </div>
                      <div className="text-[11px] text-foreground/50 mt-0.5">{booking.email}</div>
                      <div className="text-[11px] text-foreground/50 mt-0.5 font-mono flex items-center gap-1.5">
                        <span>{booking.phone}</span>
                        <a
                          href={getWhatsAppUrl(`Hello ${booking.name}, this is U 1st Creation. We are contacting you regarding your booking request.`, booking.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700 transition-colors"
                          title="Quick WhatsApp Chat"
                        >
                          <svg className="h-3 w-3 inline cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.993L2 22l5.233-1.371a9.919 9.919 0 0 0 4.777 1.224h.005c5.505 0 9.99-4.478 9.99-9.985 0-2.67-1.037-5.18-2.92-7.062C17.18 3.037 14.673 2 12.012 2zm5.727 14.128c-.25.703-1.46 1.282-1.996 1.343-.493.056-.995.27-3.13-.578-2.724-1.082-4.49-3.842-4.626-4.02-.136-.18-1.096-1.455-1.096-2.775 0-1.32.693-1.966.943-2.228.25-.262.545-.328.727-.328.182 0 .364.002.523.01.168.008.393-.063.614.47.228.55.773 1.884.84 2.018.069.135.114.293.023.473-.09.18-.136.293-.273.45-.136.16-.285.358-.409.48-.136.136-.28.285-.12.56.16.273.708 1.168 1.522 1.89.16.14.3.26.45.33.15.07.29.08.4.06.11-.02.36-.145.45-.33.1-.18.23-.42.34-.63.11-.21.23-.18.39-.12.16.06 1.046.49 1.228.58.18.09.3.135.34.208.046.073.046.42-.204 1.123z" />
                          </svg>
                        </a>
                      </div>
                    </td>

                    {/* Service/Msg Column */}
                    <td className="py-5 px-6">
                      <div className="font-semibold text-primary">
                        {booking.service || "General Wellness Consultation"}
                      </div>
                      {booking.condition ? (
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/5 text-primary border border-primary/10 mt-1">
                          Symptom: {booking.condition}
                        </span>
                      ) : (
                        <span className="text-[10px] text-foreground/40 italic block mt-1">No symptoms specified</span>
                      )}
                      {booking.notes && (
                        <div className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-sm px-2 py-1 mt-1.5 max-w-xs font-medium">
                          Clinical Notes: {booking.notes}
                        </div>
                      )}
                    </td>

                    {/* Schedule Column */}
                    <td className="py-5 px-6">
                      <div className="font-semibold text-foreground">
                        {formatDate(booking.date)}
                      </div>
                      <div className="text-foreground/50 mt-0.5">
                        Slot: {booking.timeSlot}
                      </div>
                    </td>

                    {/* Status Badge Dropdown */}
                    <td className="py-5 px-6">
                      <select
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border focus:outline-none cursor-pointer transition-all ${
                          booking.status === "confirmed"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : booking.status === "under_review"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : booking.status === "rescheduled"
                            ? "bg-orange-50 text-orange-700 border-orange-200"
                            : booking.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : booking.status === "cancelled"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="under_review">Under Review</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="rescheduled">Rescheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Actions Column */}
                    <td className="py-5 px-6 text-right space-x-2 whitespace-nowrap">
                      {/* View Details / Edit Notes */}
                      <button
                        onClick={() => openDetailsModal(booking)}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-foreground/5 text-foreground/70 hover:bg-foreground/10 transition-all font-semibold cursor-pointer border border-foreground/10"
                      >
                        Details
                      </button>

                      {/* WhatsApp Notify */}
                      <a
                        href={getWhatsAppMessageLink(booking)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-all border border-green-100"
                        title="Notify via WhatsApp"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.993L2 22l5.233-1.371a9.919 9.919 0 0 0 4.777 1.224h.005c5.505 0 9.99-4.478 9.99-9.985 0-2.67-1.037-5.18-2.92-7.062C17.18 3.037 14.673 2 12.012 2zm5.727 14.128c-.25.703-1.46 1.282-1.996 1.343-.493.056-.995.27-3.13-.578-2.724-1.082-4.49-3.842-4.626-4.02-.136-.18-1.096-1.455-1.096-2.775 0-1.32.693-1.966.943-2.228.25-.262.545-.328.727-.328.182 0 .364.002.523.01.168.008.393-.063.614.47.228.55.773 1.884.84 2.018.069.135.114.293.023.473-.09.18-.136.293-.273.45-.136.16-.285.358-.409.48-.136.136-.28.285-.12.56.16.273.708 1.168 1.522 1.89.16.14.3.26.45.33.15.07.29.08.4.06.11-.02.36-.145.45-.33.1-.18.23-.42.34-.63.11-.21.23-.18.39-.12.16.06 1.046.49 1.228.58.18.09.3.135.34.208.046.073.046.42-.204 1.123z" />
                        </svg>
                      </a>

                      {/* Delete Action */}
                      <button
                        onClick={() => setDeleteConfirmId(booking._id)}
                        className="inline-flex items-center justify-center p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer border border-red-100"
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

      {/* Patient Details & Notes Editor Modal */}
      {selectedAppointment && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedAppointment(null)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-xs"
          />
          <div className="relative bg-background p-6 rounded-2xl border border-foreground/5 shadow-xl max-w-2xl w-full z-10 animate-fade-up max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-start border-b border-foreground/5 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-primary">Patient Appointment File</h3>
                <p className="text-[10px] text-foreground/50 mt-0.5">ID: {selectedAppointment._id}</p>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-1 rounded-full text-foreground/40 hover:bg-foreground/5 hover:text-foreground transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-foreground/50 tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-foreground/15 rounded-lg bg-white text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-foreground/50 tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-foreground/15 rounded-lg bg-white text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-foreground/50 tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-foreground/15 rounded-lg bg-white text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                />
              </div>

              {/* Service */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-foreground/50 tracking-wider mb-1">
                  Wellness Service
                </label>
                <select
                  value={editForm.service}
                  onChange={(e) => setEditForm({ ...editForm, service: e.target.value })}
                  className="w-full px-3 py-2 border border-foreground/15 rounded-lg bg-white text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 cursor-pointer"
                >
                  {CLINIC_SERVICES.map((srv) => (
                    <option key={srv} value={srv}>{srv}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-foreground/50 tracking-wider mb-1">
                  Appointment Date
                </label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-foreground/15 rounded-lg bg-white text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                />
              </div>

              {/* Time Slot */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-foreground/50 tracking-wider mb-1">
                  Time Slot
                </label>
                <input
                  type="text"
                  value={editForm.timeSlot}
                  onChange={(e) => setEditForm({ ...editForm, timeSlot: e.target.value })}
                  className="w-full px-3 py-2 border border-foreground/15 rounded-lg bg-white text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-foreground/50 tracking-wider mb-1">
                  Current Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-foreground/15 rounded-lg bg-white text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="rescheduled">Rescheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Status Message / Remarks */}
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase font-bold text-foreground/50 tracking-wider mb-1">
                  Status Message / Remarks (Shown to Patient)
                </label>
                <textarea
                  rows={2}
                  value={editForm.statusMessage}
                  onChange={(e) => setEditForm({ ...editForm, statusMessage: e.target.value })}
                  placeholder="Provide details about the status update (e.g. reason for reschedule, completion details, cancellation notes...)"
                  className="w-full px-3 py-2 border border-foreground/15 rounded-lg bg-white text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 resize-none"
                />
              </div>

              {/* Symptom/Concern */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-foreground/50 tracking-wider mb-1">
                  Reported Symptom / Condition
                </label>
                <input
                  type="text"
                  value={editForm.condition}
                  onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                  className="w-full px-3 py-2 border border-foreground/15 rounded-lg bg-white text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-foreground/50 tracking-wider mb-1">
                Patient Booking Message (Read-only)
              </label>
              <div className="bg-foreground/[0.02] border border-foreground/5 p-3 rounded-lg text-xs text-foreground/60 leading-relaxed italic">
                "{editForm.message || "No booking message left by the client."}"
              </div>
            </div>

            {/* Practitioner Clinical Notes */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-emerald-800 tracking-wider mb-1 font-semibold">
                Practitioner Clinical Notes
              </label>
              <textarea
                rows={4}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Write physical evaluation logs, therapy records, recommendations, or patient tracking details..."
                className="w-full px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50/20 text-foreground text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-y"
              />
            </div>

            {/* Action Control Panel */}
            <div className="border-t border-foreground/5 pt-5 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Administrative Control Panel</h4>
                <p className="text-[10px] text-foreground/50 leading-relaxed mb-3">
                  Directly dispatch status updates, manual confirmation emails, or customize client WhatsApp links.
                </p>
              </div>

              {/* Status Update & Direct WhatsApp Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusAndWhatsApp(selectedAppointment._id, "confirmed")}
                  className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-bold border border-green-200 transition-all cursor-pointer text-center"
                >
                  Confirm & WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusAndWhatsApp(selectedAppointment._id, "cancelled")}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200 transition-all cursor-pointer text-center"
                >
                  Cancel & WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusAndWhatsApp(selectedAppointment._id, "completed")}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 transition-all cursor-pointer text-center"
                >
                  Complete & WhatsApp
                </button>
              </div>

              {/* Communication Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-accent-soft/30 p-4 rounded-xl border border-foreground/5">
                {/* Email Channels */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider block">Email Actions</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleResendEmail}
                      disabled={sendingEmail}
                      className="flex-1 px-3 py-2.5 bg-white hover:bg-foreground/5 border border-primary/20 rounded-lg text-xs font-semibold text-primary transition-all disabled:opacity-50 text-center cursor-pointer"
                    >
                      {sendingEmail ? "Sending..." : "Send Email"}
                    </button>
                    <a
                      href={`mailto:${selectedAppointment.email}?subject=Regarding Your Appointment at U 1st Creation`}
                      className="flex-1 px-3 py-2.5 bg-white hover:bg-foreground/5 border border-foreground/15 rounded-lg text-xs font-semibold text-foreground/80 transition-all text-center flex items-center justify-center cursor-pointer"
                      title="Reply to Customer"
                    >
                      Reply (Email)
                    </a>
                  </div>
                </div>

                {/* WhatsApp Channels */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider block">WhatsApp Channels</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const msg = generateWhatsAppMessageText(selectedAppointment, "followup");
                        openWhatsApp(msg, selectedAppointment.phone);
                      }}
                      className="flex-1 px-3 py-2.5 bg-white hover:bg-foreground/5 border border-green-200 rounded-lg text-xs font-semibold text-green-700 transition-all text-center cursor-pointer"
                    >
                      Follow-up
                    </button>
                    <a
                      href={getWhatsAppUrl(`Hello ${selectedAppointment.name}, this is U 1st Creation. We are contacting you regarding your appointment.`, selectedAppointment.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-2.5 bg-white hover:bg-foreground/5 border border-foreground/15 rounded-lg text-xs font-semibold text-foreground/80 transition-all text-center flex items-center justify-center cursor-pointer"
                    >
                      Open Chat
                    </a>
                  </div>
                </div>
              </div>

              {/* Live WhatsApp Custom Preview / Send Panel */}
              <div className="bg-green-50/30 border border-green-100 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-green-800 uppercase tracking-wider">WhatsApp Message Composer</span>
                  <select
                    value={whatsappTemplate}
                    onChange={(e) => handleTemplateChange(e.target.value, productNameInput)}
                    className="px-2 py-1 border border-green-200 rounded bg-white text-[11px] focus:outline-none cursor-pointer"
                  >
                    <option value="confirmed">Confirmed Template</option>
                    <option value="cancelled">Cancelled Template</option>
                    <option value="completed">Completed Template</option>
                    <option value="followup">Follow-up Template</option>
                    <option value="consultation">Consultation Reminder</option>
                    <option value="product">Product Inquiry Response</option>
                  </select>
                </div>

                {/* Show product name field if product template is selected */}
                {whatsappTemplate === "product" && (
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-foreground/50 tracking-wider mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={productNameInput}
                      onChange={(e) => {
                        setProductNameInput(e.target.value);
                        handleTemplateChange("product", e.target.value);
                      }}
                      placeholder="e.g. Purified Shilajeet Resin"
                      className="w-full px-2.5 py-1.5 border border-foreground/15 rounded bg-white text-xs focus:outline-none"
                    />
                  </div>
                )}

                <textarea
                  rows={3}
                  value={whatsappText}
                  onChange={(e) => setWhatsappText(e.target.value)}
                  className="w-full px-3 py-2 border border-green-200 rounded-lg bg-white text-xs focus:outline-none focus:border-green-500 resize-y text-foreground"
                  placeholder="Custom WhatsApp message text..."
                />

                <div className="flex justify-between items-center text-[10px] text-green-700/70">
                  <span>Target: <strong className="font-mono text-green-900">{selectedAppointment.phone}</strong></span>
                  <button
                    type="button"
                    onClick={() => openWhatsApp(whatsappText, selectedAppointment.phone)}
                    className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.993L2 22l5.233-1.371a9.919 9.919 0 0 0 4.777 1.224h.005c5.505 0 9.99-4.478 9.99-9.985 0-2.67-1.037-5.18-2.92-7.062C17.18 3.037 14.673 2 12.012 2zm5.727 14.128c-.25.703-1.46 1.282-1.996 1.343-.493.056-.995.27-3.13-.578-2.724-1.082-4.49-3.842-4.626-4.02-.136-.18-1.096-1.455-1.096-2.775 0-1.32.693-1.966.943-2.228.25-.262.545-.328.727-.328.182 0 .364.002.523.01.168.008.393-.063.614.47.228.55.773 1.884.84 2.018.069.135.114.293.023.473-.09.18-.136.293-.273.45-.136.16-.285.358-.409.48-.136.136-.28.285-.12.56.16.273.708 1.168 1.522 1.89.16.14.3.26.45.33.15.07.29.08.4.06.11-.02.36-.145.45-.33.1-.18.23-.42.34-.63.11-.21.23-.18.39-.12.16.06 1.046.49 1.228.58.18.09.3.135.34.208.046.073.046.42-.204 1.123z" />
                    </svg>
                    Send WhatsApp
                  </button>
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between pt-4 border-t border-foreground/5">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(selectedAppointment._id)}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-full text-xs font-semibold cursor-pointer text-center"
              >
                Delete File
              </button>

              <div className="flex gap-x-3 justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                  className="px-4 py-2 border border-foreground/15 rounded-full text-xs font-semibold text-foreground/80 hover:bg-foreground/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={savingDetails}
                  className="px-5 py-2 bg-primary text-white hover:bg-primary-hover rounded-full text-xs font-semibold cursor-pointer shadow-xs transition-all"
                >
                  {savingDetails ? "Saving Changes..." : "Save File Changes"}
                </button>
              </div>
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

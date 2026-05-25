"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Booking {
  _id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  condition?: string;
  message?: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch bookings from our Node.js/Express API
      const res = await fetch("http://localhost:5005/api/v1/appointments");
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }
      const json = await res.json();
      if (json.success) {
        setBookings(json.data);
      } else {
        throw new Error(json.message || "Failed to fetch bookings");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || "Failed to connect to backend server. Make sure your server is running on http://localhost:5005."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Format date helper
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
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-foreground/5 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-x-2.5 mb-2">
              <span className="h-2 w-2 rounded-full bg-[#4caf50] animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#4caf50]">
                Admin Console
              </span>
            </div>
            <h1 className="text-4xl font-normal font-serif text-foreground">
              Appointment Bookings
            </h1>
          </div>

          <div className="mt-4 sm:mt-0 flex gap-x-3">
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full border border-primary px-5 py-2 text-xs font-semibold text-primary hover:bg-primary/5 cursor-pointer disabled:opacity-50 transition-all"
            >
              {loading ? "Refreshing..." : "Refresh Board"}
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition-all"
            >
              Back to Website
            </Link>
          </div>
        </div>

        {/* Dashboard stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-foreground/5 shadow-xs">
            <span className="text-xs font-semibold tracking-wider text-foreground/50 uppercase block mb-1">
              Total Requests
            </span>
            <span className="text-3xl font-serif text-primary font-bold">
              {loading ? "..." : bookings.length}
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-foreground/5 shadow-xs">
            <span className="text-xs font-semibold tracking-wider text-foreground/50 uppercase block mb-1">
              Pending Confirmation
            </span>
            <span className="text-3xl font-serif text-accent-gold font-bold">
              {loading ? "..." : bookings.filter((b) => b.status === "pending").length}
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-foreground/5 shadow-xs">
            <span className="text-xs font-semibold tracking-wider text-foreground/50 uppercase block mb-1">
              Active Server Status
            </span>
            <span className="text-sm font-semibold inline-flex items-center gap-x-1.5 px-3 py-1 rounded-full bg-primary/5 text-primary mt-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Connected to MongoDB
            </span>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6 mb-8 animate-fade-up">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold">Backend Connection Offline</h3>
                <div className="mt-2 text-xs leading-relaxed opacity-90">
                  <p>{error}</p>
                  <p className="mt-2 font-mono bg-red-100/50 p-2 rounded border border-red-200/50">
                    Make sure you ran the backend server:
                    <br />
                    1. cd backend
                    <br />
                    2. npm run dev (or npm run start)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Board View */}
        <div className="bg-white rounded-2xl border border-foreground/5 shadow-xs overflow-hidden">
          {loading ? (
            /* Loading State Skeleton */
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
          ) : bookings.length === 0 ? (
            /* Empty State */
            <div className="p-16 text-center">
              <span className="text-4xl block mb-4">📅</span>
              <h3 className="font-serif text-lg font-medium text-foreground mb-1">
                No bookings found.
              </h3>
              <p className="text-xs text-foreground/60 max-w-sm mx-auto mb-6">
                When patients start submitting appointments through the frontend booking interface, they will show up here.
              </p>
            </div>
          ) : (
            /* Bookings Table / Board */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-foreground/10 bg-accent-soft/40">
                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-foreground/75">
                      Name / Contact
                    </th>
                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-foreground/75">
                      Service (Condition)
                    </th>
                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-foreground/75">
                      Date & Slot
                    </th>
                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-foreground/75">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/5">
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-accent-soft/20 transition-colors">
                      {/* Name / Contact Column */}
                      <td className="py-5 px-6">
                        <div className="font-serif text-base font-medium text-foreground">
                          {booking.name}
                        </div>
                        <div className="text-xs text-foreground/60 mt-0.5">
                          {booking.email}
                        </div>
                        <div className="text-xs text-foreground/60 mt-0.5 font-mono">
                          {booking.phone}
                        </div>
                      </td>

                      {/* Service Column */}
                      <td className="py-5 px-6">
                        {booking.condition ? (
                          <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded bg-[#4caf50]/10 text-primary">
                            {booking.condition}
                          </span>
                        ) : (
                          <span className="text-xs text-foreground/40 italic">General Consultation</span>
                        )}
                        {booking.message && (
                          <p className="text-xs text-foreground/65 mt-1.5 max-w-xs line-clamp-2">
                            "{booking.message}"
                          </p>
                        )}
                      </td>

                      {/* Date & Slot Column */}
                      <td className="py-5 px-6">
                        <div className="text-sm font-semibold text-foreground">
                          {formatDate(booking.date)}
                        </div>
                        <div className="text-xs text-foreground/60 mt-0.5">
                          Slot: {booking.timeSlot}
                        </div>
                      </td>

                      {/* Status Badge Column */}
                      <td className="py-5 px-6">
                        <span
                          className={`inline-flex items-center gap-x-1.5 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              booking.status === "confirmed"
                                ? "bg-green-600"
                                : booking.status === "cancelled"
                                ? "bg-red-600"
                                : "bg-amber-600"
                            }`}
                          />
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

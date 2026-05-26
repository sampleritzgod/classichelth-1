"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { API_ENDPOINTS } from "@/config";
import { useAuth } from "@/context/AuthContext";

interface Service {
  id: string;
  name: string;
  description: string;
  duration: string;
  image: string;
  category: string;
  price: number;
}

export default function Booking() {
  const services: Service[] = [
    {
      id: "ayur-consult",
      name: "Ayurvedic Consultation (Online)",
      description: "Includes online consultation, personalized wellness plans, lifestyle correction, diet recommendations, and follow-up support.",
      duration: "45 mins",
      image: "/images/service_consultation.png",
      category: "Our Services",
      price: 500,
    },
    {
      id: "nadi-parikshan",
      name: "Nadi Parikshan (Pulse Diagnosis)",
      description: "Traditional diagnostic approach. Ancient Ayurvedic assessment of body constitution, lifestyle, and dosha understanding to support wellness understanding.",
      duration: "30 mins",
      image: "/images/service_massage.png",
      category: "Our Services",
      price: 350,
    },
    {
      id: "doorstep-checkup",
      name: "Doorstep Health Checkup",
      description: "In-home BP check, sugar test, weight/BMI, basic wellness assessment, sample collection, and follow-up monitoring.",
      duration: "30 mins",
      image: "/images/blog_nutrition.png",
      category: "Wellness & Management",
      price: 600,
    },
    {
      id: "diabetes-care",
      name: "Diabetes Care Program",
      description: "Comprehensive care program for sugar level control and glycemic wellness tracking, supported by natural therapies.",
      duration: "1 hr",
      image: "/images/u1st_service_diabetes.png",
      category: "Chronic Care",
      price: 1200,
    },
    {
      id: "thyroid-care",
      name: "Thyroid & PCOS Care",
      description: "Hormonal balance and endocrine correction programs designed to restore daily vitality and metabolism balance.",
      duration: "1 hr",
      image: "/images/u1st_service_thyroid.png",
      category: "Chronic Care",
      price: 1200,
    },
    {
      id: "weight-management",
      name: "Weight & Obesity Management",
      description: "Holistic weight management addressing the underlying causes of excess weight through diet plans and routine guidance.",
      duration: "1 hr",
      image: "/images/u1st_service_obesity.png",
      category: "Wellness & Management",
      price: 1500,
    },
  ];

  const tabs = ["All Services", "Our Services", "Chronic Care", "Wellness & Management"];
  const [activeTab, setActiveTab] = useState("All Services");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingName, setBookingName] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const { user } = useAuth();

  // Prefill details when user logs in
  useEffect(() => {
    if (user) {
      setBookingName(user.name || "");
      setBookingEmail(user.email || "");
    } else {
      setBookingName("");
      setBookingEmail("");
    }
  }, [user]);

  const filteredServices = services.filter((srv) => {
    if (activeTab === "All Services") return true;
    return srv.category === activeTab;
  });

  const handleBookClick = (srv: Service) => {
    if (!user) {
      window.dispatchEvent(new CustomEvent("open_auth_modal", { detail: { mode: "login" } }));
      return;
    }
    setSelectedService(srv);
    setBookingSuccess(false);
    setBookingError(null);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      // Force user to log in before booking
      window.dispatchEvent(new CustomEvent("open_auth_modal", { detail: { mode: "login" } }));
      return;
    }

    if (bookingDate && bookingTime && selectedService && bookingName && bookingEmail && bookingPhone) {
      try {
        setIsSubmitting(true);
        setBookingError(null);

        // 1. Create order on the backend
        const orderResponse = await fetch(API_ENDPOINTS.createOrder, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: selectedService.price,
            type: "appointment",
          }),
          credentials: "include",
        });

        const orderJson = await orderResponse.json();

        if (!orderResponse.ok || !orderJson.success) {
          throw new Error(orderJson.message || "Failed to initiate payment order.");
        }

        const { order, keyId, mock } = orderJson;

        // 2. Load Razorpay script
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          throw new Error("Failed to load Razorpay Payment Gateway SDK.");
        }

        // 3. Configure checkout modal options
        const options = {
          key: keyId,
          amount: order.amount,
          currency: order.currency,
          name: "U 1st Creation",
          description: `Appointment: ${selectedService.name}`,
          order_id: order.id,
          prefill: {
            name: bookingName,
            email: bookingEmail,
            contact: bookingPhone,
          },
          theme: {
            color: "#1e3f20", // Custom dark-green minimalist theme
          },
          handler: async (response: any) => {
            try {
              setIsSubmitting(true);
              // Send signature verification to backend
              const verifyResponse = await fetch(API_ENDPOINTS.verifyPayment, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id || order.id,
                  razorpay_payment_id: response.razorpay_payment_id || `mock_pay_${Date.now()}`,
                  razorpay_signature: response.razorpay_signature || "mock_sig",
                  type: "appointment",
                  amount: selectedService.price,
                  appointmentDetails: {
                    name: bookingName,
                    email: bookingEmail,
                    phone: bookingPhone,
                    date: bookingDate,
                    timeSlot: bookingTime,
                    condition: selectedService.name,
                    message: bookingMessage,
                    service: selectedService.name,
                  },
                }),
                credentials: "include",
              });

              const verifyJson = await verifyResponse.json();

              if (verifyResponse.ok && verifyJson.success) {
                setBookingSuccess(true);
                // Clear fields
                setBookingName("");
                setBookingEmail("");
                setBookingPhone("");
                setBookingDate("");
                setBookingTime("");
                setBookingMessage("");

                setTimeout(() => {
                  setSelectedService(null);
                  setBookingSuccess(false);
                }, 4000);
              } else {
                throw new Error(verifyJson.message || "Payment verification failed.");
              }
            } catch (err: any) {
              setBookingError(err.message || "Failed to verify transaction. Please contact support.");
            } finally {
              setIsSubmitting(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsSubmitting(false);
              setBookingError("Payment checkout cancelled by user.");
            },
          },
        };

        // If mock checkout is active, simulate client handler automatically
        if (mock) {
          console.log("[MOCK] Simulating Razorpay checkout flow...");
          setTimeout(() => {
            options.handler({
              razorpay_order_id: order.id,
              razorpay_payment_id: `mock_pay_${Date.now()}`,
              razorpay_signature: "mock_sig",
            });
          }, 1500);
        } else {
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        }
      } catch (err: any) {
        console.error("Booking Error:", err);
        setBookingError(err.message || "Something went wrong. Please try again.");
        setIsSubmitting(false);
      }
    }
  };

  return (
    <section id="booking" className="py-16 sm:py-20 lg:py-24 border-t border-foreground/5 scroll-mt-20 bg-accent-soft/10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-up">
          <span className="text-xs font-bold tracking-widest text-primary uppercase mb-4 inline-block px-3 py-1 rounded-full bg-primary/5">
            Bookings
          </span>
          <h2 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl font-serif mb-6 leading-tight">
            Book a Consultation
          </h2>
          <p className="text-base text-foreground/80 max-w-lg mx-auto">
            Choose your desired consultation category below and book a customized session with our expert care team.
          </p>
        </div>

        {/* Dynamic Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 border-b border-foreground/5 pb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-full transition-all duration-300 cursor-pointer ${
                activeTab === tab
                  ? "bg-primary text-white shadow-sm"
                  : "text-foreground/80 hover:bg-foreground/5 hover:text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Service Rows List */}
        <div className="space-y-4 bg-background p-4 sm:p-6 rounded-[2rem] border border-foreground/5 shadow-md">
          {filteredServices.length === 0 ? (
            <div className="text-center py-12 text-sm text-foreground/60">
              No services found in this category.
            </div>
          ) : (
            filteredServices.map((srv) => (
              <div
                key={srv.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl hover:bg-accent-soft/30 transition-all duration-300 gap-4 border border-transparent hover:border-foreground/5 group"
              >
                {/* Left: Thumbnail & Info */}
                <div className="flex items-center gap-x-4 flex-1 w-full">
                  <div className="relative h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 overflow-hidden rounded-xl border border-foreground/5 bg-foreground/[0.01]">
                    <Image
                      src={srv.image}
                      alt={srv.name}
                      fill
                      className="object-cover transition-transform duration-350 group-hover:scale-103"
                      loading="lazy"
                      sizes="64px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {srv.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-foreground/60 mt-0.5 max-w-md line-clamp-2">
                      {srv.description}
                    </p>
                  </div>
                </div>

                {/* Right: Duration & Book Button */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-x-8 border-t sm:border-t-0 border-foreground/5 pt-3 sm:pt-0">
                  <span className="text-xs sm:text-sm font-medium text-foreground/75 text-nowrap">
                    {srv.duration}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleBookClick(srv)}
                    className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-primary-hover shadow-sm transition-all duration-350 hover:translate-y-[-2px] cursor-pointer"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Appointment Scheduler Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setSelectedService(null)} className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
          
          <div className="relative w-full max-w-md rounded-3xl bg-background p-8 shadow-2xl border border-foreground/5 animate-fade-up z-10">
            <button 
              onClick={() => setSelectedService(null)}
              className="absolute top-4 right-4 p-1.5 text-foreground/60 hover:text-foreground hover:bg-foreground/5 rounded-full cursor-pointer"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {bookingSuccess ? (
              <div className="text-center py-6">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl font-semibold text-primary mb-2">Booking Success!</h3>
                <p className="text-xs text-foreground/70">
                  Your slot for <strong>{selectedService.name}</strong> has been tentatively held. Redirecting to confirmation...
                </p>
              </div>
            ) : (
              <>
                <h3 className="font-serif text-xl text-primary font-semibold mb-1">Schedule Appointment</h3>
                <p className="text-xs text-foreground/60 mb-5">Select a date and time for <strong>{selectedService.name}</strong> (Fee: <strong>₹{selectedService.price}</strong>).</p>

                <form onSubmit={handleBookingSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {bookingError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-xs leading-relaxed">
                      ⚠️ {bookingError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      disabled={isSubmitting}
                      value={bookingName}
                      onChange={(e) => setBookingName(e.target.value)}
                      placeholder="e.g. Abhay Maheta"
                      className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all disabled:opacity-50"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Email Address</label>
                      <input 
                        type="email" 
                        required 
                        disabled={isSubmitting}
                        value={bookingEmail}
                        onChange={(e) => setBookingEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Phone Number</label>
                      <input 
                        type="tel" 
                        required 
                        disabled={isSubmitting}
                        value={bookingPhone}
                        onChange={(e) => setBookingPhone(e.target.value)}
                        placeholder="e.g. 8815010090"
                        className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Preferred Date</label>
                      <input 
                        type="date" 
                        required 
                        disabled={isSubmitting}
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Preferred Time</label>
                      <select 
                        required 
                        disabled={isSubmitting}
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all disabled:opacity-50"
                      >
                        <option value="">Choose slot</option>
                        <option value="09:00 AM">09:00 AM</option>
                        <option value="11:00 AM">11:00 AM</option>
                        <option value="02:00 PM">02:00 PM</option>
                        <option value="04:00 PM">04:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Notes / Symptoms (Optional)</label>
                    <textarea 
                      disabled={isSubmitting}
                      value={bookingMessage}
                      onChange={(e) => setBookingMessage(e.target.value)}
                      placeholder="Write any symptoms or inquiries..."
                      rows={2}
                      className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all disabled:opacity-50 resize-none"
                    />
                  </div>
                  
                  {selectedService.id === "nadi-parikshan" && (
                    <div className="flex items-start gap-x-2 text-[10px] text-foreground/50 border border-foreground/5 p-2 rounded-lg bg-accent-soft/30">
                      <span className="text-[#b38f4d] font-bold">ℹ</span>
                      <span>Please note: Pulse diagnosis is a traditional Ayurvedic assessment that supports wellness understanding and constitutional guidance.</span>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover mt-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Processing Payment..." : `Pay ₹${selectedService.price} & Book`}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

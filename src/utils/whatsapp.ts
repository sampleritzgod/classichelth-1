/**
 * Centralized WhatsApp Notification & Inquiry Utility
 */

// Primary clinic numbers (prefixed with default Indian country code "91")
const PRIMARY_NUMBERS = ["918815010090", "918320548806"];

/**
 * Dynamically routes public inquiries between the primary clinic numbers
 * using an alternating index saved in localStorage to balance the load.
 */
export const getPrimaryWhatsAppNumber = (): string => {
  if (typeof window === "undefined") {
    return PRIMARY_NUMBERS[0];
  }
  try {
    const currentIdx = parseInt(localStorage.getItem("whatsapp_route_index") || "0", 10);
    const nextIdx = (currentIdx + 1) % PRIMARY_NUMBERS.length;
    localStorage.setItem("whatsapp_route_index", nextIdx.toString());
    return PRIMARY_NUMBERS[currentIdx];
  } catch (e) {
    // Fallback to random assignment if localStorage is blocked
    return PRIMARY_NUMBERS[Math.floor(Math.random() * PRIMARY_NUMBERS.length)];
  }
};

/**
 * Generates a properly encoded WhatsApp Click-to-Chat URL.
 * If phone is not provided, it dynamically routes to one of the clinic support lines.
 */
export const getWhatsAppUrl = (message: string, phone?: string): string => {
  const targetPhone = phone || getPrimaryWhatsAppNumber();
  const cleanPhone = targetPhone.replace(/[^0-9]/g, ""); // Keep only digits
  
  // Format to ensure country code is present (add 91 if it's a 10-digit number)
  const finalPhone = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone;
  
  const encodedText = encodeURIComponent(message.trim());
  return `https://wa.me/${finalPhone}?text=${encodedText}`;
};

/**
 * Opens a WhatsApp Click-to-Chat tab in a new window/tab safely.
 */
export const openWhatsApp = (message: string, phone?: string): void => {
  const url = getWhatsAppUrl(message, phone);
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

/**
 * Reusable templates for generating professional client correspondence messages.
 */
export const WHATSAPP_TEMPLATES = {
  appointmentConfirmed: (name: string, date: string, time: string, service: string) => {
    return `Hello ${name}, this is U 1st Creation. Your appointment for "${service}" on ${date} at ${time} is confirmed. We look forward to welcoming you!`;
  },
  appointmentCancelled: (name: string, date: string, time: string, service: string) => {
    return `Hello ${name}, your scheduled session for "${service}" at U 1st Creation on ${date} at ${time} has been cancelled. Please let us know if you would like to reschedule.`;
  },
  appointmentCompleted: (name: string, service: string) => {
    return `Hello ${name}, thank you for choosing U 1st Creation for your "${service}" therapy today. We hope you feel relaxed and rejuvenated. We would love to hear your feedback!`;
  },
  followUpReminder: (name: string) => {
    return `Hello ${name}, this is a gentle follow-up from the therapist team at U 1st Creation Wellness Clinic. We wanted to check on your wellness progress and how you are feeling after your treatment. Please let us know if you need to schedule your next check-up!`;
  },
};

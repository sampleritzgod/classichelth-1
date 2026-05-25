/**
 * Generates a properly encoded WhatsApp Click-to-Chat URL.
 * Default phone number is the updated clinic contact: 918815010090
 */
export const getWhatsAppUrl = (message: string, phone: string = "918815010090"): string => {
  const cleanPhone = phone.replace(/[^0-9]/g, ""); // Keep only digits
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
};

/**
 * Opens a WhatsApp Click-to-Chat tab in a new window/tab safely.
 */
export const openWhatsApp = (message: string, phone: string = "918815010090"): void => {
  const url = getWhatsAppUrl(message, phone);
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

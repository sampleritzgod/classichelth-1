"use client";

import { useState, useEffect } from "react";
import { getWhatsAppUrl, openWhatsApp } from "@/utils/whatsapp";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import AuthModals from "@/components/AuthModals";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { API_ENDPOINTS } from "@/config";
import { resolveImageUrl } from "@/utils/image";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCloseCart = () => {
    console.log("[Cart] Closing cart, resetting checking out states");
    setIsCartOpen(false);
    setIsCheckingOut(false);
  };

  const getLink = (hash: string) => {
    return pathname === "/" ? hash : `/${hash}`;
  };

  // Sync cart state with localStorage and handle custom events
  useEffect(() => {
    const updateCartState = () => {
      const stored = localStorage.getItem("u1st_cart");
      if (stored) {
        try {
          const items: CartItem[] = JSON.parse(stored);
          setCartItems(items);
          const total = items.reduce((acc, item) => acc + item.quantity, 0);
          setCartCount(total);
        } catch (e) {
          console.error("Failed to parse cart items", e);
        }
      } else {
        setCartItems([]);
        setCartCount(0);
      }
    };

    updateCartState();
    window.addEventListener("u1st_cart_change", updateCartState);
    return () => window.removeEventListener("u1st_cart_change", updateCartState);
  }, []);

  // Event listener to open authentication modals from anywhere in the app
  useEffect(() => {
    const handleOpenAuth = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.mode) {
        setAuthModalMode(customEvent.detail.mode);
      } else {
        setAuthModalMode("login");
      }
      setAuthModalOpen(true);
    };

    window.addEventListener("open_auth_modal", handleOpenAuth);
    return () => window.removeEventListener("open_auth_modal", handleOpenAuth);
  }, []);

  const handleRemoveFromCart = (id: number) => {
    const updated = cartItems.filter(item => item.id !== id);
    localStorage.setItem("u1st_cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("u1st_cart_change"));
  };

  const handleQuantityChange = (id: number, delta: number) => {
    const updated = cartItems.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    localStorage.setItem("u1st_cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("u1st_cart_change"));
  };

  // handleLoginSubmit replaced with Context auth

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

  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!user) {
      handleCloseCart();
      window.dispatchEvent(new CustomEvent("open_auth_modal", { detail: { mode: "login" } }));
      return;
    }

    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    let shouldResetLoading = true;
    try {
      console.log("[Product Checkout] Checkout flow started. Payment request initiated.");
      setIsCheckingOut(true);

      // 1. Create order on the backend
      const orderResponse = await fetch(API_ENDPOINTS.createOrder, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: cartTotal,
          type: "product",
        }),
        credentials: "include",
      });

      const orderJson = await orderResponse.json();
      console.log("[Product Checkout] Create order response received:", orderJson);

      if (!orderResponse.ok || !orderJson.success) {
        throw new Error(orderJson.message || "Failed to initiate payment. Please try again.");
      }

      const { order, keyId, mock } = orderJson;

      // 2. Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Failed to load Razorpay Payment Gateway SDK.");
      }

      // 3. Configure Razorpay options
      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "U 1st Creation",
        description: `Purchase of ${cartItems.length} item(s)`,
        order_id: order.id,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#1e3f20",
        },
        handler: async (response: any) => {
          try {
            console.log("[Product Checkout] Razorpay payment completed. Verifying payment.");
            setIsCheckingOut(true);
            
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
                type: "product",
                amount: cartTotal,
                cartItems: cartItems,
              }),
              credentials: "include",
            });

            const verifyJson = await verifyResponse.json();
            console.log("[Product Checkout] Verification response received:", verifyJson);

            if (verifyResponse.ok && verifyJson.success) {
              console.log("[Product Checkout] Product order booked and verified successfully!");
              // Clear cart
              localStorage.removeItem("u1st_cart");
              window.dispatchEvent(new Event("u1st_cart_change"));
              handleCloseCart();
              alert("Payment successful! Your order has been placed successfully.");
            } else {
              console.error("[Product Checkout] Verification failed backend rejection.");
              throw new Error(verifyJson.message || "Payment verification failed.");
            }
          } catch (err: any) {
            console.error("[Product Checkout] Verification Exception:", err);
            alert(err.message || "Failed to verify transaction. Please contact support.");
          } finally {
            setIsCheckingOut(false);
          }
        },
        modal: {
          ondismiss: () => {
            console.log("[Product Checkout] Razorpay modal dismissed/cancelled by user.");
            setIsCheckingOut(false);
            alert("Payment checkout cancelled by user.");
          },
        },
      };

      // Mock Mode Fallback Simulation
      if (mock) {
        console.log("[MOCK] Simulating Razorpay checkout flow...");
        shouldResetLoading = false;
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
        shouldResetLoading = false;
      }
    } catch (err: any) {
      console.error("[Product Checkout] Order Creation/SDK Load Exception:", err);
      alert(err.message || "Something went wrong during checkout. Please try again.");
    } finally {
      if (shouldResetLoading) {
        setIsCheckingOut(false);
      }
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-foreground/5 bg-background/90 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href={pathname === "/" ? "#" : "/"} className="flex items-center gap-x-3 font-serif text-xl sm:text-2xl font-bold tracking-tight text-primary">
                {/* Official Shield + Plus + Leaf SVG */}
                <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-white flex items-center justify-center border border-foreground/5">
                  <img 
                    src="/images/u1st_logo_cropped.jpg" 
                    alt="U 1st Creation Logo" 
                    className="h-full w-full object-contain" 
                  />
                </div>
                <span className="font-sans font-bold tracking-tight text-[#1e3f20]">
                  U <span className="text-[#4caf50]">1st</span> Creation
                </span>
              </Link>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex lg:items-center lg:gap-x-6">
              <Link href={pathname === "/" ? "#" : "/"} className="text-sm font-medium text-foreground/90 transition-colors hover:text-primary relative after:absolute after:bottom-[-6px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">Home</Link>
              <Link href={getLink("#services")} className="text-sm font-medium text-foreground/90 transition-colors hover:text-primary relative after:absolute after:bottom-[-6px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">Services</Link>
              <Link href={getLink("#about")} className="text-sm font-medium text-foreground/90 transition-colors hover:text-primary relative after:absolute after:bottom-[-6px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">About Us</Link>
              <Link href={getLink("#blog")} className="text-sm font-medium text-foreground/90 transition-colors hover:text-primary relative after:absolute after:bottom-[-6px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">Blog</Link>
              <Link href={getLink("#booking")} className="text-sm font-medium text-foreground/90 transition-colors hover:text-primary relative after:absolute after:bottom-[-6px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">Book Online</Link>
            </div>

            {/* Right actions */}
            <div className="hidden md:flex md:items-center md:gap-x-4">
              {/* Notification Bell */}
              {user && (
                <Link
                  href="/notifications"
                  className="relative p-2 text-foreground/80 hover:text-primary hover:bg-foreground/5 rounded-full transition-all duration-300"
                  aria-label="Notifications"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-background">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Profile Log In / User Dropdown */}
              {loading ? (
                <div className="flex items-center justify-center h-7 w-7">
                  <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-x-2 text-sm font-medium text-foreground/90 hover:text-primary transition-all duration-300 cursor-pointer"
                  >
                    <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {(user?.name || "U").charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden sm:inline-block max-w-[120px] truncate">{user?.name ? user?.name.split(" ")[0] : "User"}</span>
                    <svg className={`h-4 w-4 text-foreground/50 transition-transform duration-300 ${userDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-[#faf9f5] border border-foreground/5 shadow-2xl p-2 z-50 animate-fade-up">
                      <div className="px-4 py-2 border-b border-foreground/5 mb-1 text-left">
                        <p className="text-xs font-bold text-foreground truncate">{user?.name || "User"}</p>
                        <p className="text-[10px] text-foreground/50 truncate font-medium">{user?.email || ""}</p>
                      </div>
                      
                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block text-left px-4 py-2 rounded-xl text-xs font-semibold text-foreground/80 hover:bg-foreground/5 hover:text-primary transition-all"
                      >
                        My Profile
                      </Link>

                      {(user?.role === "admin" || user?.role === "superadmin") && (
                        <a
                          href="/admin/dashboard"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setUserDropdownOpen(false)}
                          className="block text-left px-4 py-2 rounded-xl text-xs font-semibold text-[#b38f4d] hover:bg-foreground/5 transition-all"
                        >
                          Admin Dashboard
                        </a>
                      )}

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left block px-4 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                      >
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => { setAuthModalMode("login"); setAuthModalOpen(true); }}
                  className="flex items-center gap-x-1.5 text-sm font-medium text-foreground/90 hover:text-primary transition-colors cursor-pointer"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Log In</span>
                </button>
              )}


              {/* WhatsApp Us Button */}
              <a
                href={getWhatsAppUrl("Hello! I would like to make an inquiry about wellness treatments and therapist availability.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-primary px-5 py-2 text-sm font-medium text-primary transition-all duration-300 hover:bg-primary hover:text-white"
              >
                WhatsApp Us
              </a>
            </div>

            {/* Mobile Actions (Cart, Menu) */}
            <div className="flex items-center gap-x-2 lg:hidden">


              <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-foreground/80 hover:bg-foreground/5 hover:text-primary"
                aria-controls="mobile-menu"
                aria-expanded={isOpen}
              >
                <span className="sr-only">Open menu</span>
                {isOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isOpen && (
          <div className="lg:hidden border-t border-foreground/5 bg-background animate-fade-up" id="mobile-menu">
            <div className="space-y-1 px-4 py-4 sm:px-6">
              <Link href={pathname === "/" ? "#" : "/"} onClick={() => setIsOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-foreground/5 hover:text-primary">Home</Link>
              <Link href={getLink("#services")} onClick={() => setIsOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-foreground/5 hover:text-primary">Services</Link>
              <Link href={getLink("#about")} onClick={() => setIsOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-foreground/5 hover:text-primary">About Us</Link>
              <Link href={getLink("#blog")} onClick={() => setIsOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-foreground/5 hover:text-primary">Blog</Link>
              <Link href={getLink("#booking")} onClick={() => setIsOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-foreground/5 hover:text-primary">Book Online</Link>
              
              <div className="mt-6 flex flex-col gap-y-3 px-3">
                {loading ? (
                  <div className="flex items-center justify-center py-3 w-full">
                    <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  </div>
                ) : user ? (
                  <>
                    <div className="flex items-center gap-x-3 px-3 py-2 border-b border-foreground/5 text-left">
                      <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {(user?.name || "U").charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-foreground">{user?.name || "User"}</p>
                        <p className="text-[10px] text-foreground/50 font-medium">{user?.email || ""}</p>
                      </div>
                    </div>
                    
                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex w-full items-center justify-center rounded-full border border-foreground/20 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-foreground/5"
                    >
                      My Profile
                    </Link>
                    
                    <Link
                      href="/notifications"
                      onClick={() => setIsOpen(false)}
                      className="flex w-full items-center justify-center gap-x-2 rounded-full border border-foreground/20 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-foreground/5"
                    >
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                    
                    {(user?.role === "admin" || user?.role === "superadmin") && (
                      <a
                        href="/admin/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsOpen(false)}
                        className="flex w-full items-center justify-center rounded-full border border-accent-gold/40 py-2.5 text-sm font-semibold text-[#b38f4d]"
                      >
                        Admin Dashboard
                      </a>
                    )}
                    
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 py-2.5 text-sm font-semibold text-red-600 cursor-pointer"
                    >
                      Log Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setAuthModalMode("login");
                      setAuthModalOpen(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-foreground/20 py-2.5 text-sm font-medium text-foreground cursor-pointer"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Log In
                  </button>
                )}
                <a
                  href={getWhatsAppUrl("Hello! I would like to make an inquiry about wellness treatments and therapist availability.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-full bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
                >
                  WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Real Auth Modals */}
      <AuthModals
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Interactive Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div onClick={handleCloseCart} className="absolute inset-0 bg-foreground/20 backdrop-blur-xs transition-opacity" />
          
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            {/* Slide over content */}
            <div className="w-screen max-w-md transform bg-background shadow-2xl border-l border-foreground/5 animate-fade-up">
              <div className="flex h-full flex-col justify-between p-6">
                <div>
                  <div className="flex items-center justify-between border-b border-foreground/5 pb-5">
                    <h3 className="font-serif text-lg font-semibold text-primary">Shopping Cart</h3>
                    <button 
                      onClick={handleCloseCart}
                      className="p-1.5 text-foreground/60 hover:text-foreground hover:bg-foreground/5 rounded-full cursor-pointer"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
 
                  {/* Cart Items List */}
                  <div className="mt-6 divide-y divide-foreground/5 overflow-y-auto max-h-[60vh] pr-2">
                    {cartItems.length === 0 ? (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        <p className="mt-4 text-sm text-foreground/60 font-medium">Your cart is empty.</p>
                        <a 
                          href="#shop" 
                          onClick={handleCloseCart}
                          className="mt-2 text-xs font-semibold text-primary hover:underline inline-block"
                        >
                          Shop Wellness Essentials
                        </a>
                      </div>
                    ) : (
                      cartItems.map((item) => (
                        <div key={item.id} className="flex py-4 gap-4">
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-foreground/5 bg-foreground/[0.01]">
                            <img src={resolveImageUrl(item.image)} alt={item.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex flex-1 flex-col justify-between">
                            <div>
                              <div className="flex justify-between text-sm font-medium text-foreground">
                                <h4>{item.name}</h4>
                                <span className="ml-4 font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs mt-2">
                              <div className="flex items-center border border-foreground/10 rounded-md">
                                <button 
                                  onClick={() => handleQuantityChange(item.id, -1)}
                                  className="px-2 py-0.5 text-foreground/60 hover:text-foreground"
                                >
                                  -
                                </button>
                                <span className="px-2 text-foreground/80 font-medium">{item.quantity}</span>
                                <button 
                                  onClick={() => handleQuantityChange(item.id, 1)}
                                  className="px-2 py-0.5 text-foreground/60 hover:text-foreground"
                                >
                                  +
                                </button>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="font-medium text-red-600 hover:text-red-500 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Subtotal & Checkout */}
                {cartItems.length > 0 && (
                  <div className="border-t border-foreground/5 pt-4">
                    <div className="flex justify-between text-base font-semibold text-foreground mb-4">
                      <span>Subtotal</span>
                      <span>₹{cartTotal.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-foreground/50 mb-4">Shipping and taxes calculated at checkout.</p>
                    <button 
                      onClick={handleCheckout}
                      disabled={isCheckingOut}
                      className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
                    >
                      {isCheckingOut ? "Processing..." : "Checkout & Pay Now"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

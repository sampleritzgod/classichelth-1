"use client";

import { useState, useEffect } from "react";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const notifications = [
    { id: 1, text: "Your holistic consultation has been confirmed for May 28th.", time: "2 hrs ago" },
    { id: 2, text: "Special offer: Get 10% off on Himalyan Shilajeet Resin this week.", time: "1 day ago" },
    { id: 3, text: "Read our latest article on cultivating daily mindfulness.", time: "2 days ago" },
  ];

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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail && loginPassword) {
      setIsLoggedIn(true);
      setIsLoginOpen(false);
    }
  };

  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-foreground/5 bg-background/90 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="#" className="flex items-center gap-x-3 font-serif text-xl sm:text-2xl font-bold tracking-tight text-primary">
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
              </a>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex lg:items-center lg:gap-x-6">
              <a href="#" className="text-sm font-medium text-foreground/90 transition-colors hover:text-primary relative after:absolute after:bottom-[-6px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">Home</a>
              <a href="#services" className="text-sm font-medium text-foreground/90 transition-colors hover:text-primary relative after:absolute after:bottom-[-6px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">Services</a>
              <a href="#about" className="text-sm font-medium text-foreground/90 transition-colors hover:text-primary relative after:absolute after:bottom-[-6px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">About Us</a>
              <a href="#blog" className="text-sm font-medium text-foreground/90 transition-colors hover:text-primary relative after:absolute after:bottom-[-6px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">Blog</a>
              <a href="#shop" className="text-sm font-medium text-foreground/90 transition-colors hover:text-primary relative after:absolute after:bottom-[-6px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">Shop</a>
              
              {/* Notifications Trigger */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="text-sm font-medium text-foreground/90 transition-colors hover:text-primary flex items-center gap-1 cursor-pointer"
                >
                  Notifications
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                </button>
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-3 w-80 rounded-xl bg-background p-4 shadow-xl border border-foreground/5 animate-fade-up">
                    <h4 className="font-serif text-sm font-semibold border-b border-foreground/5 pb-2 mb-2 text-primary">Notifications</h4>
                    <div className="space-y-3">
                      {notifications.map(n => (
                        <div key={n.id} className="text-xs text-foreground/80 hover:bg-foreground/[0.02] p-1.5 rounded transition-colors">
                          <p>{n.text}</p>
                          <span className="text-[10px] text-foreground/40 mt-1 block">{n.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <a href="#booking" className="text-sm font-medium text-foreground/90 transition-colors hover:text-primary relative after:absolute after:bottom-[-6px] after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all">Book Online</a>
            </div>

            {/* Right actions */}
            <div className="hidden md:flex md:items-center md:gap-x-4">
              {/* Profile Log In */}
              <button 
                onClick={() => isLoggedIn ? setIsLoggedIn(false) : setIsLoginOpen(true)}
                className="flex items-center gap-x-1.5 text-sm font-medium text-foreground/90 hover:text-primary transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{isLoggedIn ? "Log Out" : "Log In"}</span>
              </button>

              {/* Shopping Cart Icon */}
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-1.5 text-foreground/80 hover:text-primary transition-all duration-300 rounded-full hover:bg-foreground/5 cursor-pointer"
                aria-label="Open cart"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm animate-scale">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* WhatsApp Us Button */}
              <a
                href="https://wa.me/918815010090"
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
                onClick={() => setIsCartOpen(true)}
                className="relative p-1.5 text-foreground/80 hover:text-primary rounded-full"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>

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
              <a href="#" onClick={() => setIsOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-foreground/5 hover:text-primary">Home</a>
              <a href="#services" onClick={() => setIsOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-foreground/5 hover:text-primary">Services</a>
              <a href="#about" onClick={() => setIsOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-foreground/5 hover:text-primary">About Us</a>
              <a href="#blog" onClick={() => setIsOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-foreground/5 hover:text-primary">Blog</a>
              <a href="#shop" onClick={() => setIsOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-foreground/5 hover:text-primary">Shop</a>
              <a href="#booking" onClick={() => setIsOpen(false)} className="block rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-foreground/5 hover:text-primary">Book Online</a>
              
              <div className="mt-6 flex flex-col gap-y-3 px-3">
                <button
                  onClick={() => { setIsOpen(false); isLoggedIn ? setIsLoggedIn(false) : setIsLoginOpen(true); }}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-foreground/20 py-2.5 text-sm font-medium text-foreground"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {isLoggedIn ? "Log Out" : "Log In"}
                </button>
                <a
                  href="https://wa.me/918815010090"
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

      {/* Interactive Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div onClick={() => setIsLoginOpen(false)} className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md rounded-2xl bg-background p-8 shadow-2xl border border-foreground/5 animate-fade-up">
            <button 
              onClick={() => setIsLoginOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-foreground/60 hover:text-foreground hover:bg-foreground/5 rounded-full"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="font-serif text-2xl text-primary font-semibold mb-2">Welcome Back</h3>
            <p className="text-xs text-foreground/60 mb-6">Enter your details to access your health profile and consultations.</p>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full rounded-lg border border-foreground/20 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Password</label>
                <input 
                  type="password" 
                  required 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-lg border border-foreground/20 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              <button 
                type="submit" 
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover mt-2"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div onClick={() => setIsCartOpen(false)} className="absolute inset-0 bg-foreground/20 backdrop-blur-xs transition-opacity" />
          
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            {/* Slide over content */}
            <div className="w-screen max-w-md transform bg-background shadow-2xl border-l border-foreground/5 animate-fade-up">
              <div className="flex h-full flex-col justify-between p-6">
                <div>
                  <div className="flex items-center justify-between border-b border-foreground/5 pb-5">
                    <h3 className="font-serif text-lg font-semibold text-primary">Shopping Cart</h3>
                    <button 
                      onClick={() => setIsCartOpen(false)}
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
                          onClick={() => setIsCartOpen(false)}
                          className="mt-2 text-xs font-semibold text-primary hover:underline inline-block"
                        >
                          Shop Wellness Essentials
                        </a>
                      </div>
                    ) : (
                      cartItems.map((item) => (
                        <div key={item.id} className="flex py-4 gap-4">
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-foreground/5 bg-foreground/[0.01]">
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
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
                      onClick={() => alert("Checkout flow simulated!")}
                      className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
                    >
                      Checkout
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

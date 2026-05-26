"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { API_ENDPOINTS } from "@/config";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("admin@example.com");

  // Keep adminEmail synced with user email
  useEffect(() => {
    if (user?.email) {
      setAdminEmail(user.email);
    }
  }, [user]);

  // Route protection and redirection
  useEffect(() => {
    if (loading) return;

    if (pathname === "/admin/login") {
      if (user && (user?.role === "admin" || user?.role === "superadmin")) {
        router.replace("/admin/dashboard");
      }
    } else {
      if (!user) {
        router.replace("/admin/login");
      }
    }
  }, [user, loading, pathname, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  // Determine if we need to show verification/redirect loader
  const isRedirecting =
    loading ||
    (pathname === "/admin/login" && user && (user?.role === "admin" || user?.role === "superadmin")) ||
    (pathname !== "/admin/login" && !user);

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          <p className="text-xs text-foreground/50 font-serif">Verifying administrative session...</p>
        </div>
      </div>
    );
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Check role authorization for all other admin routes
  if (user && user?.role !== "admin" && user?.role !== "superadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-foreground/5 shadow-xl text-center space-y-6">
          <span className="text-4xl block">🚫</span>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-red-600">
            Access Denied
          </h2>
          <p className="text-xs text-foreground/60 leading-relaxed">
            You are authenticated as <span className="font-semibold">{user.email}</span>, but you do not have administrative permissions to view this portal.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/"
              className="bg-primary hover:bg-primary-hover text-white py-2.5 px-6 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
            >
              Go to Home Page
            </Link>
            <button
              onClick={handleLogout}
              className="border border-red-200 text-red-600 hover:bg-red-700 py-2.5 px-6 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navigation: NavItem[] = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      name: "Appointments",
      href: "/admin/appointments",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: "Messages Inbox",
      href: "/admin/messages",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: "Product Catalog",
      href: "/admin/products",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      name: "Blogs Journal",
      href: "/admin/blogs",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
  ];
  
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-foreground/5 bg-accent-soft/30">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* Logo Brand */}
          <div className="flex items-center flex-shrink-0 px-6 mb-6">
            <span className="h-2.5 w-2.5 rounded-full bg-[#4caf50] mr-2" />
            <span className="font-serif text-lg font-bold tracking-tight text-primary">
              U 1st Admin
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="mt-5 flex-1 px-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/10"
                      : "text-foreground/80 hover:bg-foreground/5 hover:text-primary"
                  }`}
                >
                  <span className={`mr-3 transition-colors ${isActive ? "text-white" : "text-foreground/50 group-hover:text-primary"}`}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="flex-shrink-0 flex border-t border-foreground/5 p-4 bg-accent-soft/50">
          <div className="flex items-center">
            <div>
              <span className="inline-block h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                AT
              </span>
            </div>
            <div className="ml-3">
              <p className="text-xs font-semibold text-foreground">Practitioner</p>
              <p className="text-[10px] text-foreground/50 font-medium">{adminEmail}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* Mobile Top Navbar */}
        <header className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-background/80 backdrop-blur-md border-b border-foreground/5 md:hidden px-4 justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-foreground/75 hover:bg-foreground/5 hover:text-primary cursor-pointer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="ml-3 font-serif text-base font-bold text-primary">
              U 1st Admin
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
          >
            Logout
          </button>
        </header>

        {/* Mobile Menu Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden" role="dialog" aria-modal="true">
            <div
              className="fixed inset-0 bg-foreground/30 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />

            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-background pt-5 pb-4 border-r border-foreground/5">
              {/* Close Button */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-full text-foreground/60 hover:bg-foreground/5 hover:text-foreground cursor-pointer"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Drawer Brand */}
              <div className="flex-shrink-0 flex items-center px-6 mb-4">
                <span className="h-2.5 w-2.5 rounded-full bg-[#4caf50] mr-2" />
                <span className="font-serif text-lg font-bold tracking-tight text-primary">
                  U 1st Admin
                </span>
              </div>

              {/* Navigation links inside drawer */}
              <nav className="mt-5 flex-1 px-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-primary text-white"
                          : "text-foreground/80 hover:bg-foreground/5"
                      }`}
                    >
                      <span className={`mr-3 ${isActive ? "text-white" : "text-foreground/40"}`}>
                        {item.icon}
                      </span>
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Top Header - Desktop only */}
        <header className="hidden md:flex h-16 bg-background/50 backdrop-blur-md border-b border-foreground/5 px-8 justify-between items-center sticky top-0 z-10">
          <div className="text-xs text-foreground/50 font-medium">
            System status: <span className="text-[#4caf50] font-semibold">Active</span> • Powered by MongoDB Atlas
          </div>

          <div className="flex items-center gap-x-3">
            <Link
              href="/"
              className="text-xs font-semibold text-foreground/70 hover:text-foreground border border-foreground/15 px-4 py-2 rounded-full hover:bg-foreground/5 transition-all"
            >
              Exit to Clinic Site
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-red-600 hover:text-red-700 border border-red-200/50 px-4 py-2 rounded-full hover:bg-red-50 transition-all cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </header>

        {/* Nested Page Content Container */}
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

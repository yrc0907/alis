"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import SignOutButton from "@/components/SignOutButton";
import { Bell, MessageSquare, Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle outside click to close mobile menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="h-16 w-full border-b border-border/40 bg-background flex items-center px-4 z-10">
      <div className="flex items-center w-full justify-between">
        <div className="flex items-center">
          {/* Title */}
          <div className="font-semibold text-xl">
            Dashboard
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 hidden md:flex"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>

          <button
            className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 hidden md:flex"
            aria-label="Messages"
          >
            <MessageSquare className="h-5 w-5" />
          </button>

          <ThemeToggle />

          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden md:block" />

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          <SignOutButton />
        </div>
      </div>

      {/* Mobile Menu with animation */}
      <div
        ref={menuRef}
        className={`absolute top-16 left-0 right-0 bg-background dark:bg-gray-900 border-b border-border/40 shadow-md z-20 transform transition-all duration-300 ease-in-out ${mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
      >
        <div className="flex flex-col space-y-3 p-4">
          <button
            className="flex items-center gap-2 py-2"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" /> Notifications
          </button>
          <button
            className="flex items-center gap-2 py-2"
            aria-label="Messages"
          >
            <MessageSquare className="h-5 w-5" /> Messages
          </button>
        </div>
      </div>
    </header>
  );
} 
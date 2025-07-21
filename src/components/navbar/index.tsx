"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import SignOutButton from "@/components/SignOutButton";
import { Bell, MessageSquare, Menu, PanelLeft, PanelLeftClose, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useSidebar } from "@/context/SidebarContext";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isExpanded, toggleSidebar, isMobile } = useSidebar();

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
    <header className="h-16 w-full border-b border-border/40 bg-background fixed top-0 right-0 left-0 flex items-center px-4 z-30">
      <div className="flex items-center w-full justify-between">
        <div className="flex items-center">
          {/* Sidebar toggle for mobile menu bar */}
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="p-2 mr-2"
              aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isExpanded ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
            </button>
          )}

          {/* Title is always shown in navbar regardless of sidebar state */}
          <div className="font-semibold text-xl transition-all duration-300 hidden md:block">
            Dashboard
          </div>

          {/* Mobile title - always shown on mobile */}
          <div className="font-semibold text-xl md:hidden">
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

          {/* Mobile menu button moved to right */}
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
          <div className="font-semibold">Dashboard</div>
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
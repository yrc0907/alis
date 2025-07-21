"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Settings, Calendar, BarChart4, ChevronRight, ChevronLeft, PanelLeftClose, PanelLeft } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { Logo } from "./Logo";

const navItems = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: Users, label: "Users", href: "/dashboard/users" },
  { icon: Calendar, label: "Calendar", href: "/dashboard/calendar" },
  { icon: BarChart4, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" }
];

const Sidebar = () => {
  const pathname = usePathname();
  const { isExpanded, toggleSidebar, isMobile } = useSidebar();

  return (
    <aside
      className={`flex h-full bg-background dark:bg-gray-900 border-r border-border/40 flex-col fixed transition-all duration-300 z-[20] left-0 pt-16 
        ${isExpanded ? (isMobile ? "w-[240px]" : "w-[200px]") : "w-[60px]"}
        ${isMobile ? (isExpanded ? "translate-x-0" : "translate-x-[-60px]") : "translate-x-0"}
        ${isMobile && isExpanded ? "shadow-xl" : ""}`}
    >
      <div className="flex flex-col gap-y-4 pt-4 flex-1 overflow-y-auto">
        {/* Logo and product name */}
        <div className="px-3 pb-4 mb-2 border-b border-border/40">
          <Logo showText={isExpanded} />
        </div>

        <div className="px-2 mb-2">
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-full py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded ? (
              <div className="flex items-center justify-between w-full px-1.5">
                <span className="text-xs font-medium">Collapse</span>
                <PanelLeftClose className="h-4 w-4" />
              </div>
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              href={item.href}
              key={item.href}
              className={`flex items-center gap-x-2 text-sm px-3 py-2.5 transition-all hover:bg-gray-100 dark:hover:bg-gray-800 mx-2 rounded-md ${isActive ? "bg-gray-100 dark:bg-gray-800" : ""
                }`}
              onClick={() => isMobile && toggleSidebar()}
            >
              <Icon className={`h-5 w-5 min-w-5 ${isActive ? "text-primary" : ""}`} />
              <span className={`whitespace-nowrap transition-all ${isExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Mobile Toggle Button */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className={`fixed top-20 ${isExpanded ? "left-[240px]" : "left-0"} z-30 p-2 rounded-r-md bg-background dark:bg-gray-800 border border-l-0 border-border/40 shadow-md transition-all duration-300`}
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      )}
    </aside>
  );
};

export default Sidebar;

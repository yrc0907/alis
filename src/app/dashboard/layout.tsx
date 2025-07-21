"use client";

import Sidebar from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Inner component that can access the sidebar context
const DashboardContent = ({ children }: { children: React.ReactNode }) => {
  const { isExpanded, toggleSidebar, isMobile } = useSidebar();

  return (
    <div className="h-screen bg-background dark:bg-gray-950 text-foreground">
      <Navbar />
      <Sidebar />

      {/* Overlay for mobile when sidebar is expanded */}
      {isExpanded && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-[5] md:hidden"
          onClick={() => toggleSidebar()}
          aria-hidden="true"
        />
      )}

      {/* Adjusting the main content padding to prevent overlap */}
      <main
        className={`pt-16 min-h-screen transition-all duration-300 
          ${isExpanded && !isMobile ? "md:pl-[216px]" : "md:pl-[76px]"} 
          ${isExpanded && isMobile ? "pl-0" : "pl-0"}
        `}
        style={{ width: "100%" }}
      >
        {/* Added additional container with better mobile spacing */}
        <div className="py-6 px-2">
          {children}
        </div>
      </main>
    </div>
  );
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <DashboardContent>
        {children}
      </DashboardContent>
    </SidebarProvider>
  );
};

export default DashboardLayout;
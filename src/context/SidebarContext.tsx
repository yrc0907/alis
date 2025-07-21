"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';

interface SidebarContextType {
  isExpanded: boolean;
  toggleSidebar: () => void;
  setSidebarState: (state: boolean) => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive state based on screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Collapse sidebar on mobile automatically
      if (mobile) {
        setIsExpanded(false);
      }
    };

    // Set initial state
    handleResize();

    // Use media query for better performance
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (e.matches) {
        setIsExpanded(false);
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    window.addEventListener('resize', handleResize);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const setSidebarState = (state: boolean) => {
    setIsExpanded(state);
  };

  return (
    <SidebarContext.Provider value={{ isExpanded, toggleSidebar, setSidebarState, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);

  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }

  return context;
}; 
"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface SignOutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export default function SignOutButton({ variant = "outline" }: SignOutButtonProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <Button variant={variant} size="sm" onClick={handleSignOut} className="hidden md:flex">
      Sign Out
    </Button>
  );
} 
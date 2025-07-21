import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  showText: boolean;
  className?: string;
}

export function Logo({ showText, className }: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex items-center justify-center min-w-[32px] h-8 bg-primary rounded-md overflow-hidden">
        {/* You can replace this with an actual image */}
        {/* <Image src="/logo.png" alt="Logo" width={32} height={32} /> */}
        <span className="text-white font-bold text-sm">D</span>
      </div>

      {showText && (
        <span className="ml-3 font-semibold whitespace-nowrap transition-all">
          DashPro
        </span>
      )}
    </div>
  );
} 
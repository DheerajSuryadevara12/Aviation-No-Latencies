import { useState, useEffect } from 'react';
import { Bell, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-[200] flex items-center justify-between px-6 transition-all duration-300",
        "h-[80px] border-b-[1.5px] border-[#e01818]",
        "before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#e01818] before:via-[#ff5555] before:via-[#e01818] before:to-transparent",
        "bg-[#0b0b0d]"
      )}
      style={{
        boxShadow: "0 2px 24px rgba(224,24,24,0.22)",
      }}
    >
      {/* Left: Logo & Heading */}
      <div className="flex items-center gap-4">
        <img 
          src="/NforceoneLogo.png" 
          alt="NForceOne Logo" 
          className="h-[56px] object-contain" 
        />
        <div>
          <h1 className="text-xl font-['Outfit'] font-bold text-white tracking-wide leading-none">
            SkyOps Command
          </h1>
          <p className="text-xs text-[rgba(255,255,255,0.45)] uppercase font-['DM_Sans'] font-medium mt-0.5">
            Aviation Operations
          </p>
        </div>
      </div>

      {/* Center: Live Pill */}
      <div 
        className="hidden md:flex items-center gap-3 rounded-lg"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(224,24,24,0.35)",
          padding: "6px 14px",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-[7px] h-[7px] border-none rounded-full bg-[#e01818] animate-nforceone-pulse" />
          <span className="text-[12px] font-['DM_Sans'] font-semibold text-[#fff]">
            Live System
          </span>
        </div>
        <div className="w-px h-[14px] bg-[rgba(224,24,24,0.4)]" />
        <span className="text-[13px] font-['DM_Mono'] font-medium text-[#ff7070] tabular-nums">
          {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Bell Icon */}
        <button className="relative flex items-center justify-center w-[34px] h-[34px] rounded-lg transition-all border border-[rgba(255,255,255,0.08)] bg-transparent hover:bg-[rgba(224,24,24,0.15)] hover:border-[rgba(224,24,24,0.5)] group">
          <div className="absolute -top-1 -right-1 w-[6px] h-[6px] rounded-full bg-[#e01818] shadow-[0_0_5px_#e01818]" />
          <Bell className="w-4 h-4 text-[rgba(255,255,255,0.4)] group-hover:text-[#ff5555] transition-colors" />
        </button>

        {/* Settings Icon */}
        <button className="relative flex items-center justify-center w-[34px] h-[34px] rounded-lg transition-all border border-[rgba(255,255,255,0.08)] bg-transparent hover:bg-[rgba(224,24,24,0.15)] hover:border-[rgba(224,24,24,0.5)] group">
          <Settings className="w-4 h-4 text-[rgba(255,255,255,0.4)] group-hover:text-[#ff5555] transition-colors" />
        </button>

        {/* User Button */}
        <button className="flex items-center gap-2 transition-all rounded-lg border border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(224,24,24,0.12)] hover:border-[rgba(224,24,24,0.5)] px-[12px] pl-[6px] py-[5px]">
          <div className="flex items-center justify-center w-[27px] h-[27px] rounded-[6px] bg-gradient-to-br from-[#e01818] to-[#8f0000] shadow-[0_0_8px_rgba(224,24,24,0.22)]">
            <User className="w-3.5 h-3.5 text-white/90" />
          </div>
          <span className="text-[13px] font-['DM_Sans'] font-semibold text-[rgba(255,255,255,0.85)] tracking-wide hidden lg:block">
            Operator
          </span>
        </button>
      </div>
    </header>
  );
}

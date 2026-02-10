import { Plane, Bell, Settings, User, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="nav-header sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Brand - Futuristic */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-gradient-to-br from-cyan-400/20 to-cyan-600/10 border border-cyan-400/30 backdrop-blur-sm">
                <Plane className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-cyan-400 rounded-full border-2 border-primary animate-pulse shadow-[0_0_8px_hsl(185_70%_50%/0.6)]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-primary-foreground tracking-wide font-display">
                SkyOps Command
              </h1>
              <p className="text-xs text-cyan-400/80 tracking-widest uppercase font-mono">
                Aviation Operations
              </p>
            </div>
          </div>

          {/* Status Indicator - Futuristic */}
          <div className="hidden md:flex items-center gap-3 px-5 py-2.5 rounded-lg bg-white/5 border border-cyan-400/20 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Radio className="w-4 h-4 text-cyan-400" />
                <div className="absolute inset-0 animate-ping opacity-50">
                  <Radio className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="text-sm text-primary-foreground/90 font-medium tracking-wide">Live System</span>
            </div>
            <div className="w-px h-4 bg-cyan-400/30" />
            <span className="text-xs text-cyan-400/70 font-mono tabular-nums">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </span>
          </div>

          {/* Actions - Futuristic */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground/70 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-all duration-200"
            >
              <Bell className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground/70 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-all duration-200"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <div className="ml-3 flex items-center gap-3 pl-4 border-l border-cyan-400/20">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400/20 to-cyan-600/10 border border-cyan-400/30 flex items-center justify-center">
                <User className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-sm text-primary-foreground/80 hidden lg:block font-medium tracking-wide">Operator</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

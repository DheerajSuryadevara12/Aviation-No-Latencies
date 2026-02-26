import { useState, useEffect } from 'react';
import { Order } from '@/types/aviation';
import { Phone, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IncomingCallPopupProps {
    order: Order;
    onMonitor: () => void;
    onDismiss: () => void;
}

export function IncomingCallPopup({ order, onMonitor, onDismiss }: IncomingCallPopupProps) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onDismiss}
            />

            {/* Popup Card */}
            <div className="relative z-10 w-[400px] animate-fade-in">
                {/* Glow ring */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-cyan-500/30 rounded-2xl blur-lg animate-pulse" />

                <div className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4 flex items-center justify-center gap-3">
                        <div className="relative">
                            <Phone className="w-6 h-6 text-white" />
                            <div className="absolute inset-0 animate-ping">
                                <Phone className="w-6 h-6 text-white opacity-40" />
                            </div>
                        </div>
                        <h2 className="text-white text-lg font-bold tracking-wide uppercase">
                            Incoming Call
                        </h2>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-6 space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground font-medium">Pilot Name:</span>
                                <span className="text-foreground font-semibold text-base">
                                    {order.customer?.name || 'Unknown Pilot'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground font-medium">Phone:</span>
                                <span className="text-foreground/80 font-mono text-sm">
                                    {order.customer?.phone || 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground font-medium">Duration:</span>
                                <span className="text-accent font-mono font-bold text-base tabular-nums">
                                    {formatTime(elapsed)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground font-medium">Existing Reservations:</span>
                                <span className="text-foreground/80 font-semibold text-sm">N</span>
                            </div>
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

                        {/* Monitor Button */}
                        <button
                            onClick={onMonitor}
                            className={cn(
                                "w-full flex items-center justify-center gap-3 py-3.5 rounded-xl",
                                "bg-gradient-to-r from-emerald-600 to-emerald-500",
                                "hover:from-emerald-500 hover:to-emerald-400",
                                "text-white font-bold text-sm tracking-wider uppercase",
                                "transition-all duration-200 shadow-lg shadow-emerald-500/25",
                                "hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
                            )}
                        >
                            <Activity className="w-5 h-5" />
                            <span>Monitoring...</span>
                            <span className="flex gap-0.5">
                                <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

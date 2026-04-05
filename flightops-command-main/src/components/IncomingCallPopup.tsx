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
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onDismiss}
            />

            {/* Popup Card */}
            <div className="relative z-10 w-[420px] fade-up">
                {/* Brand border glow */}
                <div className="absolute -inset-[2px] bg-gradient-to-r from-transparent via-[#e01818] to-transparent rounded-2xl opacity-50 blur-md animate-pulse" />

                <div className="relative bg-[#0b0b0d] border border-[#e01818]/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(224,24,24,0.25)]">
                    {/* Header Shimmer Line */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#e01818] to-transparent" />

                    {/* Header */}
                    <div className="bg-[#141416] px-8 py-6 flex items-center gap-5 border-b border-[#e01818]/10">
                        <div className="relative flex-shrink-0">
                            <div className="w-14 h-14 rounded-full bg-[#e01818]/5 flex items-center justify-center border border-[#e01818]/20">
                                <Phone className="w-7 h-7 text-[#e01818] animate-pulse" />
                            </div>
                            <div className="absolute -inset-1 rounded-full border-2 border-[#e01818]/30 animate-ping opacity-20" />
                        </div>
                        <div>
                            <h2 className="text-white font-['Outfit'] text-xl font-black tracking-tight leading-none uppercase">
                                Incoming <span className="text-[#e01818]">Call</span>
                            </h2>
                            <p className="text-[10px] text-white/40 font-['DM_Mono'] mt-1 uppercase tracking-[2px]">
                                SkyOps Command Center
                            </p>
                        </div>
                    </div>

                    {/* Agent Activity Line (Visual) */}
                    <div className="px-8 py-2 bg-[#e01818]/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#16a15e] animate-pulse" />
                            <span className="text-[10px] text-white/60 font-['DM_Sans'] font-bold uppercase tracking-wider">Line Active</span>
                        </div>
                        <span className="text-[10px] text-[#e01818] font-['DM_Mono'] font-bold uppercase">{formatTime(elapsed)}</span>
                    </div>

                    {/* Body */}
                    <div className="px-8 py-8 space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center group">
                                <span className="text-xs text-white/40 font-['DM_Sans'] uppercase tracking-widest group-hover:text-[#e01818]/60 transition-colors">Commander / Pilot</span>
                                <span className="text-white font-['Outfit'] font-bold text-lg leading-none">
                                    {order.customer?.name || 'Unknown Pilot'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-xs text-white/40 font-['DM_Sans'] uppercase tracking-widest group-hover:text-[#e01818]/60 transition-colors">Reference ID</span>
                                <span className="text-white/80 font-['DM_Mono'] text-sm tracking-wider bg-white/5 px-2 py-0.5 rounded">
                                    {order.id}
                                </span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-xs text-white/40 font-['DM_Sans'] uppercase tracking-widest group-hover:text-[#e01818]/60 transition-colors">Flight Tail</span>
                                <span className="text-[#e01818] font-['Outfit'] font-black text-sm tracking-widest">
                                    {order.customer?.planeNumber || 'N/A'}
                                </span>
                            </div>
                        </div>

                        {/* Monitor Button */}
                        <button
                            onClick={onMonitor}
                            className={cn(
                                "relative w-full group overflow-hidden rounded-xl",
                                "transition-all duration-300 shadow-lg shadow-[#e01818]/10 hover:shadow-[#e01818]/25 hover:scale-[1.02] active:scale-[0.98]"
                            )}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#b91c1c] to-[#e01818] group-hover:from-[#e01818] group-hover:to-[#ff4444] transition-all duration-300" />
                            <div className="relative flex items-center justify-center gap-3 py-4 text-white font-['Outfit'] font-black text-sm tracking-widest uppercase">
                                <Activity className="w-5 h-5 animate-pulse" />
                                <span>Monitor Operations</span>
                                <div className="flex gap-1 ml-1">
                                    <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

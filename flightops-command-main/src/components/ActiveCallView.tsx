import { useState, useCallback, useRef, useEffect } from 'react';
import { Order } from '@/types/aviation';
import { LiveConversationPanel } from './LiveConversationPanel';
import { LiveAgentActivityPanel } from './LiveAgentActivityPanel';
import { CustomerInfoPanel } from './CustomerInfoPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, PhoneForwarded, PhoneOff, Clock } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/lib/utils';

interface ActiveCallViewProps {
    order: Order;
    onBack: () => void;
    onEndCall: () => void;
}

interface AgentResult {
    vendor: string;
    price: string;
    details: string;
}

interface Message {
    id: string;
    role: 'pilot' | 'agent' | 'system';
    content: string;
    timestamp: Date;
    triggersAgents?: string[];
    isError?: boolean;
}

export function ActiveCallView({ order, onBack, onEndCall }: ActiveCallViewProps) {
    const [isConnected, setIsConnected] = useState(false);
    const [activeAgents, setActiveAgents] = useState<{ id: string; details?: string; action?: 'search' | 'finalize' }[]>([]);
    const [completedAgents, setCompletedAgents] = useState<{ id: string; success: boolean; result?: AgentResult }[]>([]);
    const [failedAgents, setFailedAgents] = useState<string[]>([]);
    const [conversationComplete, setConversationComplete] = useState(false);
    const [liveMessages, setLiveMessages] = useState<Message[]>([]);
    const [acceptedAlternatives, setAcceptedAlternatives] = useState<{ agentType: string; alternative: string }[]>([]);
    const [elapsed, setElapsed] = useState(0);
    const wsRef = useRef<WebSocket | null>(null);

    // Call timer
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

    // Connect to WebSocket on mount
    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3001');

        ws.onopen = () => {
            console.log('ActiveCallView: Connected to Live Transcript Server');
            setIsConnected(true);
        };

        ws.onerror = (error) => {
            console.error('ActiveCallView: WebSocket error:', error);
            setLiveMessages(prev => [...prev, {
                id: `err-${Date.now()}`,
                role: 'system',
                content: 'Connection error. Please ensure backend is running.',
                timestamp: new Date(),
                isError: true
            }]);
            setIsConnected(false);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Handle INITIAL_STATE — load history for this order
                if (data.type === 'INITIAL_STATE') {
                    const myOrder = data.orders.find((o: any) => o.id === order.id);
                    if (myOrder?.transcript && Array.isArray(myOrder.transcript)) {
                        setLiveMessages(myOrder.transcript.map((t: any) => ({
                            id: `msg-hist-${t.timestamp}`,
                            role: t.role,
                            content: t.content,
                            timestamp: new Date(t.timestamp),
                            isError: t.isError || false
                        })));
                        if (myOrder.triggeredAgents && Array.isArray(myOrder.triggeredAgents)) {
                            setActiveAgents(myOrder.triggeredAgents);
                        }
                    }
                    return;
                }

                // Filter for this specific order
                if (data.orderId && data.orderId !== order.id) return;
                if (data.type === 'NEW_ORDER') return;

                if (data.type === 'ORDER_UPDATE') {
                    if (data.order.triggeredAgents) {
                        setActiveAgents(data.order.triggeredAgents);
                    }
                    if (data.order.status === 'completed') {
                        setConversationComplete(true);
                    }
                    return;
                }

                // Handle transcript messages
                const content = data.text || data.message || data.content || JSON.stringify(data);
                const role = (data.role === 'user' || data.role === 'pilot') ? 'pilot'
                    : (data.role === 'assistant' || data.role === 'agent') ? 'agent'
                        : 'system';

                const newMessage: Message = {
                    id: `msg-${Date.now()}-${Math.random()}`,
                    role: role as any,
                    content,
                    timestamp: new Date(),
                    isError: data.isError
                };

                setLiveMessages(prev => {
                    if (prev.find(m => m.content === content && Math.abs(m.timestamp.getTime() - Date.now()) < 2000)) return prev;
                    return [...prev, newMessage];
                });

                // Update triggered agents from transcript data
                if (data.triggered_agents && Array.isArray(data.triggered_agents) && data.triggered_agents.length > 0) {
                    setActiveAgents(prev => {
                        const map = new Map(prev.map(a => [a.id, a]));
                        data.triggered_agents.forEach((newAgent: any) => {
                            map.set(newAgent.id, {
                                id: newAgent.id,
                                details: newAgent.details,
                                action: newAgent.action || 'search'
                            });
                        });
                        return Array.from(map.values());
                    });
                }
            } catch (err) {
                console.error('ActiveCallView: Error parsing WS message:', err);
            }
        };

        ws.onclose = () => {
            console.log('ActiveCallView: WebSocket closed');
            setIsConnected(false);
        };

        wsRef.current = ws;

        return () => {
            ws.close();
        };
    }, [order.id]);

    const handleAgentTriggered = useCallback((agentTypes: string[]) => {
        setActiveAgents(prev => {
            const map = new Map(prev.map(a => [a.id, a]));
            agentTypes.forEach(id => {
                if (!map.has(id)) map.set(id, { id });
            });
            return Array.from(map.values());
        });
    }, []);

    const handleAgentComplete = useCallback((agentId: string, success: boolean, result?: AgentResult) => {
        if (success) {
            setCompletedAgents(prev => [...prev, { id: agentId, success, result }]);
        } else {
            setFailedAgents(prev => [...prev, agentId]);
        }
    }, []);

    const handleConversationComplete = useCallback(() => {
        setConversationComplete(true);
    }, []);

    const handleMessagesUpdate = useCallback((messages: Message[]) => {
        setLiveMessages(messages);
    }, []);

    const handleAlternativeAccepted = useCallback((agentType: string, alternative: string) => {
        setAcceptedAlternatives(prev => [...prev, { agentType, alternative }]);
        setLiveMessages(prev => [...prev, {
            id: `msg-alt-${Date.now()}`,
            role: 'system',
            content: `✓ Alternative accepted: ${alternative}`,
            timestamp: new Date(),
        }]);
    }, []);

    return (
        <div className="fixed inset-0 z-40 bg-[#0d1321] flex flex-col">
            {/* Top Bar */}
            <div className="flex-shrink-0 bg-gradient-to-r from-[#1a2744] to-[#162033] border-b border-cyan-500/20 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onBack}
                            className="text-slate-400 hover:text-white hover:bg-white/10"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Dashboard
                        </Button>

                        <div className="w-px h-6 bg-cyan-500/20" />

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Phone className="w-4 h-4 text-cyan-400" />
                                    {!conversationComplete && (
                                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                    )}
                                </div>
                                <span className="text-white font-semibold text-sm">ACTIVE CALL:</span>
                            </div>
                            <span className="text-cyan-300 font-semibold">
                                {order.customer?.name || 'Pilot'}
                            </span>
                            <span className="text-slate-400 font-mono text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                ({formatTime(elapsed)})
                            </span>
                            <StatusBadge
                                status={conversationComplete ? (failedAgents.length > 0 ? 'failed' : 'completed') : 'processing'}
                                size="sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
                            isConnected
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-red-500/15 text-red-400 border border-red-500/30"
                        )}>
                            <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                            )} />
                            {isConnected ? 'Live' : 'Disconnected'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0 flex">
                {/* Left Panel — Transcript */}
                <div className="flex-1 flex flex-col border-r border-cyan-500/10">
                    <div className="px-5 py-3 border-b border-cyan-500/10 bg-white/[0.02]">
                        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                            Real-Time Transcript
                        </h3>
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <div className="h-full aviation-panel border-0 rounded-none">
                            <LiveConversationPanel
                                order={order}
                                onAgentTriggered={handleAgentTriggered}
                                onAgentComplete={handleAgentComplete}
                                onConversationComplete={handleConversationComplete}
                                onMessagesUpdate={handleMessagesUpdate}
                                onAlternativeAccepted={handleAlternativeAccepted}
                                isSimulating={false}
                                isConnected={isConnected}
                                messages={liveMessages}
                                completedAgents={completedAgents}
                                failedAgents={failedAgents}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Panel — Agent Activity + Customer Info */}
                <div className="w-[420px] flex-shrink-0 flex flex-col">
                    <div className="px-5 py-3 border-b border-cyan-500/10 bg-white/[0.02]">
                        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                            Agent Activity
                        </h3>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                        {/* Customer Info */}
                        <div className="p-4 border-b border-cyan-500/10">
                            <CustomerInfoPanel order={order} />
                        </div>

                        {/* Agent Activity */}
                        <div className="p-4">
                            <LiveAgentActivityPanel
                                order={order}
                                activeAgents={activeAgents}
                                isProcessing={!conversationComplete}
                                onAgentComplete={handleAgentComplete}
                                onAlternativeAccepted={handleAlternativeAccepted}
                                acceptedAlternatives={acceptedAlternatives}
                                completedAgents={completedAgents}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom — Call Control Bar */}
            <div className="flex-shrink-0 border-t border-cyan-500/20 bg-[#1a2744]/80 backdrop-blur-sm px-6 py-3">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono">{order.customer?.planeNumber || 'N/A'}</span>
                        <span>•</span>
                        <span>Order {order.id}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-2">
                            Call Control
                        </h4>

                        <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white gap-2"
                        >
                            <PhoneForwarded className="w-4 h-4" />
                            Transfer
                        </Button>

                        <Button
                            size="sm"
                            onClick={onEndCall}
                            className={cn(
                                "bg-red-600 hover:bg-red-500 text-white font-bold gap-2 px-6",
                                "shadow-lg shadow-red-600/25 hover:shadow-red-500/40",
                                "transition-all duration-200"
                            )}
                        >
                            <PhoneOff className="w-4 h-4" />
                            End Call
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

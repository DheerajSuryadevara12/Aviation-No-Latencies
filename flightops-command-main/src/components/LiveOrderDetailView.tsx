import { useState, useCallback, useRef, useEffect } from 'react';
import { Order } from '@/types/aviation';
import { CustomerInfoPanel } from './CustomerInfoPanel';
import { LiveConversationSummary } from './LiveConversationSummary';
import { LiveConversationPanel } from './LiveConversationPanel';
import { LiveAgentActivityPanel } from './LiveAgentActivityPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { getStoredConversationForOrder, getAgentDetailsForOrder } from '@/data/conversationScripts';

interface LiveOrderDetailViewProps {
  order: Order;
  onBack: () => void;
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

export function LiveOrderDetailView({ order, onBack }: LiveOrderDetailViewProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activeAgents, setActiveAgents] = useState<{ id: string; details?: string; action?: 'search' | 'finalize' }[]>([]);
  const [completedAgents, setCompletedAgents] = useState<{ id: string; success: boolean; result?: AgentResult }[]>([]);
  const [failedAgents, setFailedAgents] = useState<string[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);
  const [acceptedAlternatives, setAcceptedAlternatives] = useState<{ agentType: string; alternative: string }[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const handleStartLiveDemo = () => {
    // setIsSimulating(true); // Disable simulation mode
    setHasStarted(true);
    setActiveAgents([]);
    setCompletedAgents([]);
    setFailedAgents([]);
    setConversationComplete(false);
    setLiveMessages([]);

    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:3001');

    ws.onopen = () => {
      console.log('Connected to Live Transcript Server');
      setIsConnected(true);
      // Only show waiting message if we don't have messages yet
      if (liveMessages.length === 0 && order.id.startsWith('live-order-')) {
        // Check if we have history explicitly first (though INITIAL_STATE likely already came or will come)
        // If empty, show waiting
        setLiveMessages([{
          id: 'system-connect',
          role: 'system',
          content: 'Connected to Live Call System... Waiting for call...',
          timestamp: new Date()
        }]);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
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
        console.log('Received message:', data);

        // Handle INITIAL_STATE (History)
        if (data.type === 'INITIAL_STATE') {
          // Find our order in the list
          const myOrder = data.orders.find((o: any) => o.id === order.id);
          if (myOrder && myOrder.transcript && Array.isArray(myOrder.transcript)) {
            console.log('Loaded transcript history:', myOrder.transcript);
            setLiveMessages(myOrder.transcript.map((t: any) => ({
              id: `msg-hist-${t.timestamp}`,
              role: t.role,
              content: t.content,
              timestamp: new Date(t.timestamp),
              isError: t.isError || false
            })));
            if (myOrder.transcript.length > 0) {
              setHasStarted(true);
            }

            // Restore active agents
            if (myOrder.triggeredAgents && Array.isArray(myOrder.triggeredAgents)) {
              console.log('Restoring active agents:', myOrder.triggeredAgents);
              setActiveAgents(myOrder.triggeredAgents);
            }
          }
          return;
        }

        // Filter for this specific order if orderId is present
        if (data.orderId && data.orderId !== order.id) {
          return;
        }

        if (data.type === 'NEW_ORDER') return; // Ignore new order notifications here
        if (data.type === 'ORDER_UPDATE') {
          // Update active agents from order update
          if (data.order.triggeredAgents) {
            console.log('Processed ORDER_UPDATE active agents:', data.order.triggeredAgents);
            setActiveAgents(data.order.triggeredAgents);
          }
          return;
        }

        // Handle ElevenLabs webhook format or generic format
        // Assuming data has 'role' and 'message' or 'text'
        // Adjust parsing logic as needed
        const content = data.text || data.message || data.content || JSON.stringify(data);
        const role = (data.role === 'user' || data.role === 'pilot') ? 'pilot' : (data.role === 'assistant' || data.role === 'agent') ? 'agent' : 'system';

        const newMessage: Message = {
          id: `msg-${Date.now()}-${Math.random()}`,
          role: role as any,
          content: content,
          timestamp: new Date(),
          isError: data.isError
        };

        setLiveMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m.content === content && Math.abs(m.timestamp.getTime() - new Date().getTime()) < 2000)) return prev;
          return [...prev, newMessage];
        });

        // Trigger agents if backend identified them (Legacy support or if explicit field used)
        if (data.triggered_agents && Array.isArray(data.triggered_agents) && data.triggered_agents.length > 0) {
          console.log('Backend triggered agents:', data.triggered_agents);
          // data.triggered_agents is [{ id: "catering", details: "Chicken Biryani" }, ...]
          setActiveAgents(prev => {
            const map = new Map(prev.map(a => [a.id, a]));
            data.triggered_agents.forEach((newAgent: any) => {
              // Update if exists (to capture new details/action), or add if new
              map.set(newAgent.id, {
                id: newAgent.id,
                details: newAgent.details,
                action: newAgent.action || 'search' // Default to search if not provided
              });
            });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      setIsConnected(false);
    };

    wsRef.current = ws;
  };

  // Load mock data for history/demo orders
  useEffect(() => {
    if (!order.id.startsWith('live-order-') && !order.id.startsWith('live-placeholder')) {
      const mockTranscript = getStoredConversationForOrder(order);
      setLiveMessages(mockTranscript.map((t, i) => ({
        id: `mock-msg-${i}`,
        role: t.role,
        content: t.content,
        timestamp: t.timestamp,
        isError: false
      })));
      setHasStarted(true);
      setConversationComplete(order.status === 'completed');

      // Trigger all agents for mock orders
      const agentDetails = getAgentDetailsForOrder(order);
      if (agentDetails.length > 0) {
        setActiveAgents(agentDetails.map(d => ({
          id: d.agentType,
          details: d.specificRequest,
          action: 'finalize' // Mock orders assume finalized state usually
        })));

        // For the demo, mark ALL agents as completed for mock orders (active/future/past)
        // so they don't look like they are running.
        setCompletedAgents(agentDetails.map(d => ({
          id: d.agentType,
          success: true,
          result: {
            vendor: 'System',
            price: d.price || 'Confirmed',
            details: d.specificRequest,
            specificRequest: d.specificRequest
          }
        })));
      }
    }
  }, [order.id]);

  const handleResetSimulation = () => {
    setIsSimulating(false);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setHasStarted(false);
    setActiveAgents([]);
    setCompletedAgents([]);
    setFailedAgents([]);
    setConversationComplete(false);
    setLiveMessages([]);
    setAcceptedAlternatives([]);
  };

  // Auto-connect for live orders
  useEffect(() => {
    // If we already have messages (from history), consider it started
    if ((order as any).transcript && (order as any).transcript.length > 0) {
      setHasStarted(true);
    }

    if (order.id.startsWith('live-order-') && !hasStarted && !isSimulating) {
      handleStartLiveDemo();
    }
  }, [order.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

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
    setIsSimulating(false);
  }, []);

  const handleMessagesUpdate = useCallback((messages: Message[]) => {
    setLiveMessages(messages);
  }, []);

  const handleAlternativeAccepted = useCallback((agentType: string, alternative: string) => {
    // Track accepted alternatives to pass to agent panel
    setAcceptedAlternatives(prev => [...prev, { agentType, alternative }]);

    // Add a message to the conversation about the accepted alternative
    const newMessage: Message = {
      id: `msg-alt-${Date.now()}`,
      role: 'system',
      content: `✓ Alternative accepted: ${alternative}`,
      timestamp: new Date(),
    };
    setLiveMessages(prev => [...prev, newMessage]);
  }, []);

  return (
    <div className="animate-fade-in h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-3 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{order.customer?.name || 'Pilot'}</h1>
              <StatusBadge status={conversationComplete ? (failedAgents.length > 0 ? 'failed' : 'completed') : order.status} size="lg" />
            </div>
            <p className="text-muted-foreground mt-1">
              Order <span className="font-mono">{order.id}</span> • {order.customer?.planeNumber || 'N/A'}
            </p>
          </div>

        </div>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left Panel - Customer Info + Summary */}
        <div className="lg:col-span-3 space-y-4 overflow-y-auto custom-scrollbar">
          <CustomerInfoPanel order={order} />
          <LiveConversationSummary
            order={order}
            liveMessages={liveMessages}
            conversationComplete={conversationComplete}
            hasFailed={failedAgents.length > 0}
          />
        </div>

        {/* Center Panel - Live Conversation */}
        <div className="lg:col-span-5">
          <div className="aviation-panel h-full flex flex-col overflow-hidden">
            <LiveConversationPanel
              order={order}
              onAgentTriggered={handleAgentTriggered}
              onAgentComplete={handleAgentComplete}
              onConversationComplete={handleConversationComplete}
              onMessagesUpdate={handleMessagesUpdate}
              onAlternativeAccepted={handleAlternativeAccepted}
              isSimulating={isSimulating}
              isConnected={isConnected}
              messages={liveMessages}
              completedAgents={completedAgents}
              failedAgents={failedAgents}
            />
          </div>
        </div>

        {/* Right Panel - Live Agent Activity */}
        <div className="lg:col-span-4">
          <div className="aviation-panel h-full flex flex-col overflow-hidden">
            <LiveAgentActivityPanel
              order={order}
              activeAgents={activeAgents}
              isProcessing={hasStarted && !conversationComplete}
              onAgentComplete={handleAgentComplete}
              onAlternativeAccepted={handleAlternativeAccepted}
              acceptedAlternatives={acceptedAlternatives}
              completedAgents={completedAgents}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

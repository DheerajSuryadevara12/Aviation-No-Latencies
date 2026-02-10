import { useState, useEffect, useCallback } from 'react';
import { ReservationRequest, ChatMessage, ReservationAgentExecution } from '@/types/aviation';
import { ChatPanel } from './ChatPanel';
import { AgentActivityPanel } from './AgentActivityPanel';
import { ConsolidatedResponse } from './ConsolidatedResponse';
import { RequestSummaryPanel } from './RequestSummaryPanel';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, Zap } from 'lucide-react';

// Initial agent states
const createInitialAgents = (): ReservationAgentExecution[] => [
  {
    id: 'agent-ramp',
    agentType: 'ramp_availability',
    agentName: 'Airport Ramp Availability Agent',
    status: 'pending',
    currentAction: 'Waiting to check ramp availability',
    steps: [],
  },
  {
    id: 'agent-customer',
    agentType: 'customer_lookup',
    agentName: 'Customer Lookup Agent',
    status: 'pending',
    currentAction: 'Waiting to search customer records',
    steps: [],
  },
  {
    id: 'agent-services',
    agentType: 'services_amenities',
    agentName: 'Services & Amenities Agent',
    status: 'pending',
    currentAction: 'Waiting to check service availability',
    steps: [],
  },
  {
    id: 'agent-weather',
    agentType: 'weather_checker',
    agentName: 'Weather Analysis Agent',
    status: 'pending',
    currentAction: 'Waiting to analyze forecasts',
    steps: [],
  },
  {
    id: 'agent-workforce',
    agentType: 'workforce',
    agentName: 'Workforce Scheduling Agent',
    status: 'pending',
    currentAction: 'Waiting to assign ground crew',
    steps: [],
  },
];

// Simulated conversation script
const conversationScript = [
  {
    delay: 0,
    message: {
      role: 'pilot' as const,
      content: 'Please schedule me a reservation for flight number NB23L for MCO airport tomorrow at 2PM EST.',
    },
  },
  {
    delay: 1500,
    message: {
      role: 'agent' as const,
      content: 'Absolutely, let me help you with that. I\'m checking availability and pulling up your records now.',
    },
  },
  {
    delay: 8000,
    message: {
      role: 'agent' as const,
      content: 'I located your previous history and it looks like you typically order catering and champagne as soon as you land. Is this something you would like to add this time as well?',
    },
  },
  {
    delay: 10000,
    message: {
      role: 'pilot' as const,
      content: 'Yes, and also can you check to see if you can drop off my guest clothes there for dry cleaning services? And I may need a refuel as well.',
    },
  },
  {
    delay: 11500,
    message: {
      role: 'agent' as const,
      content: 'Sure, let me look into getting these services added. One moment please...',
    },
  },
  {
    delay: 18000,
    message: {
      role: 'agent' as const,
      content: 'I have great news! Looks like MCO has dry cleaning amenities available, so I\'ve added that to your reservation along with catering, champagne, and refueling. Your reservation for tomorrow at 2PM EST is now confirmed. Is there anything else I can help you with?',
    },
  },
];

// Agent action sequences
const agentActionSequences: Record<string, { action: string; delay: number }[]> = {
  'agent-ramp': [
    { action: 'Connecting to MCO airport systems...', delay: 500 },
    { action: 'Checking ramp slot availability...', delay: 1500 },
    { action: 'Verifying time slot: 2PM EST...', delay: 2500 },
    { action: 'Ramp slot confirmed ✓', delay: 3500 },
  ],
  'agent-customer': [
    { action: 'Searching tail number NB23L...', delay: 300 },
    { action: 'Found customer records...', delay: 1200 },
    { action: 'Loading preference history...', delay: 2000 },
    { action: 'Customer profile loaded ✓', delay: 3000 },
  ],
  'agent-services': [
    { action: 'Querying MCO amenities...', delay: 800 },
    { action: 'Checking catering availability...', delay: 1800 },
    { action: 'Checking dry cleaning services...', delay: 2800 },
    { action: 'All services available ✓', delay: 4000 },
  ],
  'agent-weather': [
    { action: 'Fetching weather data...', delay: 400 },
    { action: 'Analyzing forecast for MCO...', delay: 1400 },
    { action: 'Checking for advisories...', delay: 2200 },
    { action: 'Weather conditions clear ✓', delay: 3200 },
  ],
  'agent-workforce': [
    { action: 'Checking ground crew schedules...', delay: 600 },
    { action: 'Assigning available personnel...', delay: 1600 },
    { action: 'Confirming shift coverage...', delay: 2600 },
    { action: 'Ground crew assigned ✓', delay: 3800 },
  ],
};

export function ReservationFlowDemo() {
  const [reservation, setReservation] = useState<ReservationRequest>({
    id: 'res-demo-001',
    flightNumber: 'NB23L',
    airport: 'MCO',
    requestedTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    status: 'incoming',
    agents: createInitialAgents(),
    messages: [],
    services: {
      catering: false,
      champagne: false,
      dryCleanig: false,
      refueling: false,
      carService: false,
    },
    createdAt: new Date(),
  });

  const [isRunning, setIsRunning] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0);
  const [highlightedServices, setHighlightedServices] = useState<string[]>([]);

  const resetDemo = useCallback(() => {
    setReservation({
      id: 'res-demo-001',
      flightNumber: 'NB23L',
      airport: 'MCO',
      requestedTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'incoming',
      agents: createInitialAgents(),
      messages: [],
      services: {
        catering: false,
        champagne: false,
        dryCleanig: false,
        refueling: false,
        carService: false,
      },
      createdAt: new Date(),
    });
    setCurrentScriptIndex(0);
    setIsRunning(false);
    setIsAgentTyping(false);
    setHighlightedServices([]);
  }, []);

  const startDemo = useCallback(() => {
    resetDemo();
    setIsRunning(true);
  }, [resetDemo]);

  // Run conversation script
  useEffect(() => {
    if (!isRunning || currentScriptIndex >= conversationScript.length) return;

    const currentItem = conversationScript[currentScriptIndex];
    const timeout = setTimeout(() => {
      // Show typing indicator for agent messages
      if (currentItem.message.role === 'agent') {
        setIsAgentTyping(true);
        setTimeout(() => {
          setIsAgentTyping(false);
          setReservation(prev => ({
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: `msg-${currentScriptIndex}`,
                ...currentItem.message,
                timestamp: new Date(),
              },
            ],
          }));
          setCurrentScriptIndex(prev => prev + 1);
        }, 1000);
      } else {
        setReservation(prev => ({
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: `msg-${currentScriptIndex}`,
              ...currentItem.message,
              timestamp: new Date(),
            },
          ],
        }));
        setCurrentScriptIndex(prev => prev + 1);
      }
    }, currentItem.delay);

    return () => clearTimeout(timeout);
  }, [isRunning, currentScriptIndex]);

  // Trigger agents after first agent response (index 1)
  useEffect(() => {
    if (currentScriptIndex === 2 && isRunning) {
      // Start all agents in parallel
      setReservation(prev => ({
        ...prev,
        status: 'processing',
        agents: prev.agents.map(a => ({
          ...a,
          status: 'in_progress' as const,
          currentAction: agentActionSequences[a.id][0].action,
        })),
      }));

      // Run each agent's action sequence
      Object.entries(agentActionSequences).forEach(([agentId, actions]) => {
        actions.forEach((action, index) => {
          setTimeout(() => {
            setReservation(prev => ({
              ...prev,
              agents: prev.agents.map(a =>
                a.id === agentId
                  ? {
                      ...a,
                      currentAction: action.action,
                      status: index === actions.length - 1 ? 'success' : 'in_progress',
                    }
                  : a
              ),
            }));
          }, action.delay);
        });
      });
    }
  }, [currentScriptIndex, isRunning]);

  // Update services after pilot's second message (requesting catering, champagne, dry cleaning, refuel)
  useEffect(() => {
    if (currentScriptIndex === 4 && isRunning) {
      // Highlight the services being requested
      setHighlightedServices(['catering', 'champagne', 'dry cleaning', 'refueling']);
      
      // Clear highlights after animation
      setTimeout(() => {
        setHighlightedServices([]);
      }, 3000);
    }
  }, [currentScriptIndex, isRunning]);

  // Update services after confirmation
  useEffect(() => {
    if (currentScriptIndex === 5 && isRunning) {
      setReservation(prev => ({
        ...prev,
        services: {
          catering: true,
          champagne: true,
          dryCleanig: true,
          refueling: true,
          carService: false,
        },
      }));
    }
  }, [currentScriptIndex, isRunning]);

  // Mark as confirmed when all agents complete
  useEffect(() => {
    if (currentScriptIndex >= conversationScript.length) {
      setReservation(prev => ({
        ...prev,
        status: 'confirmed',
      }));
      setIsRunning(false);
    }
  }, [currentScriptIndex]);

  const isProcessing = reservation.agents.some(a => a.status === 'in_progress');
  const allComplete = reservation.agents.every(a => a.status === 'success');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Live Reservation Flow</h2>
          <p className="text-sm text-muted-foreground">
            Watch the AI agents orchestrate a reservation in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isRunning && currentScriptIndex === 0 && (
            <Button onClick={startDemo} className="gap-2">
              <Play className="w-4 h-4" />
              Start Demo
            </Button>
          )}
          {(isRunning || currentScriptIndex > 0) && (
            <Button onClick={resetDemo} variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          )}
          {isProcessing && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-info/10 text-info text-sm">
              <Zap className="w-3.5 h-3.5" />
              Processing...
            </div>
          )}
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden">
        {/* Left - Request Summary */}
        <div className="border-r border-border bg-card overflow-hidden">
          <RequestSummaryPanel 
            reservation={reservation}
            highlightedServices={highlightedServices}
          />
        </div>

        {/* Center - Chat Panel */}
        <div className="border-r border-border bg-card overflow-hidden">
          <ChatPanel 
            messages={reservation.messages}
            isAgentTyping={isAgentTyping}
          />
        </div>

        {/* Right - Agent Activity */}
        <div className="bg-muted/30 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-hidden">
            <AgentActivityPanel 
              agents={reservation.agents}
              isProcessing={isProcessing}
            />
          </div>
          
          {/* Consolidated Response */}
          {allComplete && reservation.status === 'confirmed' && (
            <div className="p-4 border-t border-border">
              <ConsolidatedResponse reservation={reservation} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

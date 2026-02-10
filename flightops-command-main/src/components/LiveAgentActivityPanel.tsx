import React, { useState, useEffect, useRef } from 'react';
import { Order } from '@/types/aviation';
import { cn } from '@/lib/utils';
import {
  Bot,
  Zap,
  Fuel,
  UtensilsCrossed,
  Wine,
  Car,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  UserCog,
  Clock,
  DollarSign,
  Package,
  Info,
  Search,
  ListChecks,
  ShoppingCart,
  Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AgentRequestDetails, getAgentDetailsForOrder } from '@/data/conversationScripts';
interface AgentResult {
  vendor: string;
  price: string;
  details: string;
  specificRequest?: string;
  alternatives?: string[];
  unavailableMessage?: string;
  timeConstraint?: string;
  acceptedAlternative?: string;
  specialOrder?: boolean;
  specialOrderEta?: string;
}

interface LiveAgentActivityPanelProps {
  order: Order;
  activeAgents: { id: string; details?: string; action?: 'search' | 'finalize' }[];
  isProcessing: boolean;
  onAgentComplete: (agentId: string, success: boolean, result?: AgentResult) => void;
  onAlternativeAccepted?: (agentType: string, alternative: string) => void;
  acceptedAlternatives?: { agentType: string; alternative: string }[];
  completedAgents: { id: string; success: boolean; result?: AgentResult }[]; // Add this
}



interface AgentStep {
  label: string;
  status: 'pending' | 'in_progress' | 'completed';
  details?: string;
}

interface LiveAgent {
  id: string;
  type: string;
  name: string;
  status: 'inactive' | 'pending' | 'in_progress' | 'success' | 'failed' | 'unavailable';
  currentStep: string;
  progress: number;
  result?: AgentResult;
  requestDetails?: AgentRequestDetails;
  steps: AgentStep[];
  searchResults?: string[];
  selectedOption?: string;
  availabilityInfo?: { item: string; available: boolean; eta?: string }[];
}

// All 5 agent types (matching screenshot)
const ALL_AGENT_TYPES = ['reservation', 'refueling', 'catering', 'wine', 'car_rental'];

const agentIcons: Record<string, React.ElementType> = {
  reservation: ListChecks,
  refueling: Fuel,
  catering: UtensilsCrossed,
  wine: Wine,
  car_rental: Car,
};

const agentNames: Record<string, string> = {
  reservation: 'Reservation Agent',
  refueling: 'Refueling Agent',
  catering: 'Catering Agent',
  wine: 'Wine Agent',
  car_rental: 'Ground Transport Agent',
};

const agentDescriptions: Record<string, string> = {
  reservation: 'Manages flight reservation',
  refueling: 'Coordinates fuel delivery',
  catering: 'Arranges in-flight meals',
  wine: 'Curates wine selections',
  car_rental: 'Books ground transport',
};

// Detailed step configurations for each agent
const agentStepConfigs: Record<string, { label: string; detailFn: (details?: AgentRequestDetails) => string }[]> = {
  reservation: [
    { label: 'Checking schedule', detailFn: (d) => `Request: ${d?.specificRequest || 'Flight reservation'}` },
    { label: 'Verifying availability', detailFn: () => 'Checking hangar and ramp space' },
    { label: 'Confirming slot', detailFn: () => 'Reservation slot confirmed' },
    { label: 'Finalizing reservation', detailFn: () => 'Booking complete' },
  ],
  refueling: [
    { label: 'Searching fuel providers', detailFn: (d) => `Looking for ${d?.specificRequest || 'Jet-A fuel'}` },
    { label: 'Checking availability', detailFn: () => 'Verifying fuel inventory at FBO' },
    { label: 'Calculating requirements', detailFn: (d) => `Fuel: ${d?.specificRequest?.split(' ')[0] || '500'} gallons` },
    { label: 'Confirming delivery', detailFn: () => 'Scheduling tanker truck' },
  ],
  catering: [
    { label: 'Searching menu options', detailFn: (d) => `Request: ${d?.specificRequest || 'Catering services'}` },
    { label: 'Checking availability', detailFn: () => 'Verifying kitchen capacity' },
    { label: 'Preparing selections', detailFn: () => 'Confirming ingredients available' },
    { label: 'Confirming order', detailFn: () => 'Order placed with kitchen' },
  ],
  wine: [
    { label: 'Searching wine cellar', detailFn: (d) => `Looking for: ${d?.specificRequest || 'Wine selection'}` },
    { label: 'Checking availability', detailFn: () => 'Verifying stock levels' },
    { label: 'Matching preferences', detailFn: (d) => d?.alternatives?.length ? `${d.alternatives.length} alternatives found` : 'Selection confirmed' },
    { label: 'Confirming selection', detailFn: () => 'Bottles reserved' },
  ],
  car_rental: [
    { label: 'Searching vehicles', detailFn: (d) => `Request: ${d?.specificRequest || 'Ground transport'}` },
    { label: 'Checking availability', detailFn: () => 'Searching partner inventory' },
    { label: 'Reserving transport', detailFn: () => 'Securing vehicle' },
    { label: 'Confirming pickup', detailFn: () => 'Driver assigned' },
  ],
};

// Vendor data per agent type
const agentVendors: Record<string, { name: string; rating: string }> = {
  reservation: { name: 'FlightOps Reservations', rating: '5.0★' },
  refueling: { name: 'Atlantic Aviation Fuel', rating: '4.9★' },
  catering: { name: 'Sky Cuisine Premium', rating: '4.8★' },
  wine: { name: 'Vintage Cellars Elite', rating: '4.9★' },
  car_rental: { name: 'Signature Executive', rating: '4.7★' },
};

// Diana Prince (cust-004) always has car_rental failure
const FAILING_CUSTOMER_ID = 'cust-004';
const FAILING_AGENT_TYPE = 'car_rental';

export function LiveAgentActivityPanel({
  order,
  activeAgents,
  isProcessing,
  onAgentComplete,
  onAlternativeAccepted,
  acceptedAlternatives = [],
  completedAgents = [],
}: LiveAgentActivityPanelProps) {
  // Get agent details for this order
  const orderAgentDetails = getAgentDetailsForOrder(order);

  // Create initial agents for ALL 4 types
  const createInitialAgents = (): LiveAgent[] => {
    return ALL_AGENT_TYPES.map(type => {
      const details = orderAgentDetails.find(d => d.agentType === type);
      const stepConfigs = agentStepConfigs[type] || [];
      return {
        id: type,
        type,
        name: agentNames[type],
        status: 'inactive' as const,
        currentStep: agentDescriptions[type],
        progress: 0,
        requestDetails: details,
        steps: stepConfigs.map(s => ({
          label: s.label,
          status: 'pending' as const,
          details: s.detailFn(details),
        })),
        searchResults: [],
        availabilityInfo: [],
      };
    });
  };

  const [liveAgents, setLiveAgents] = useState<LiveAgent[]>(createInitialAgents);

  // Dialog state
  const [selectedAgent, setSelectedAgent] = useState<LiveAgent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Track which agents have been activated
  const activatedAgentsRef = useRef<Set<string>>(new Set());

  // Determine if this order should have a failure
  const shouldSimulateFailure = order.customerId === FAILING_CUSTOMER_ID;

  // Update agents when order changes
  useEffect(() => {
    const newAgents = createInitialAgents();
    setLiveAgents(newAgents);
    activatedAgentsRef.current = new Set();
  }, [order.customerId]);

  // Log active agents updates
  useEffect(() => {
    console.log('LiveAgentActivityPanel received activeAgents:', activeAgents);
  }, [activeAgents]);

  // Reset agents when processing stops and no triggers
  useEffect(() => {
    if (!isProcessing && activeAgents.length === 0) {
      setLiveAgents(createInitialAgents());
      activatedAgentsRef.current = new Set();
    }
  }, [isProcessing, activeAgents.length === 0]);

  // Sync completed agents (fixes issue where past orders show running agents)
  useEffect(() => {
    if (completedAgents.length > 0) {
      setLiveAgents(prev => prev.map(agent => {
        const completedInfo = completedAgents.find(ca => ca.id === agent.id);
        if (completedInfo) {
          // Force to completed state
          return {
            ...agent,
            status: 'success' as const,
            currentStep: 'Service Confirmed',
            progress: 100,
            result: completedInfo.result || agent.result, // Use provided result or fallback
            steps: agent.steps.map(s => ({ ...s, status: 'completed' as const }))
          };
        }
        return agent;
      }));
    }
  }, [completedAgents]);

  // Open dialog for agent details
  const openAgentDialog = (agent: LiveAgent) => {
    setSelectedAgent(agent);
    setDialogOpen(true);
  };

  // Handle accepting an alternative
  const handleAcceptAlternative = (agentType: string, alternative: string) => {
    setLiveAgents(prev => prev.map(a =>
      a.type === agentType
        ? {
          ...a,
          status: 'success' as const,
          currentStep: 'Alternative confirmed',
          selectedOption: alternative,
          steps: a.steps.map(s => ({ ...s, status: 'completed' as const })),
          result: {
            ...a.result!,
            acceptedAlternative: alternative,
          }
        }
        : a
    ));

    // Update selected agent for dialog
    setSelectedAgent(prev => prev?.type === agentType ? {
      ...prev,
      status: 'success' as const,
      selectedOption: alternative,
      result: {
        ...prev.result!,
        acceptedAlternative: alternative,
      }
    } : prev);

    onAlternativeAccepted?.(agentType, alternative);
  };

  // Handle placing a special order
  const handlePlaceSpecialOrder = (agentType: string, item: string) => {
    const eta = '4-6 hours';

    setLiveAgents(prev => prev.map(a =>
      a.type === agentType
        ? {
          ...a,
          status: 'success' as const,
          currentStep: 'Special order placed',
          selectedOption: `${item} (Special Order)`,
          steps: a.steps.map(s => ({ ...s, status: 'completed' as const })),
          result: {
            ...a.result!,
            acceptedAlternative: item,
            specialOrder: true,
            specialOrderEta: eta,
          }
        }
        : a
    ));

    setSelectedAgent(prev => prev?.type === agentType ? {
      ...prev,
      status: 'success' as const,
      selectedOption: `${item} (Special Order)`,
      result: {
        ...prev.result!,
        acceptedAlternative: item,
        specialOrder: true,
        specialOrderEta: eta,
      }
    } : prev);

    onAlternativeAccepted?.(agentType, `${item} (Special Order - ETA: ${eta})`);
  };

  // Activate and progress agents when triggered
  useEffect(() => {
    if (activeAgents.length === 0) return;

    // Filter for new agents or agents with status updates (action change) or detail updates
    const agentsToUpdate = activeAgents.filter(agent => {
      // If agent is already marked completed externally, do NOT simulate
      const isCompleted = completedAgents.some(ca => ca.id === agent.id);
      if (isCompleted) return false;

      const isNew = !activatedAgentsRef.current.has(agent.id);
      const currentAgent = liveAgents.find(a => a.id === agent.id);
      const isActionUpdate = currentAgent && agent.action === 'finalize' && currentAgent.status !== 'success';
      const isDetailUpdate = currentAgent && agent.details && agent.details !== currentAgent.requestDetails?.specificRequest;
      return isNew || isActionUpdate || isDetailUpdate;
    });

    if (agentsToUpdate.length === 0) return;

    agentsToUpdate.forEach(agent => activatedAgentsRef.current.add(agent.id));

    agentsToUpdate.forEach((agentObj, index) => {
      const type = agentObj.id;
      const delay = index * 200;
      const agentDetails = orderAgentDetails.find(d => d.agentType === type);
      let isUnavailable = agentDetails?.unavailable && order.customerId !== FAILING_CUSTOMER_ID;
      const shouldFail = shouldSimulateFailure && type === FAILING_AGENT_TYPE;
      const stepConfigs = agentStepConfigs[type] || [];
      const action = agentObj.action || 'search';

      // Check what kind of update this is
      const currentAgent = liveAgents.find(a => a.id === type);
      const isNew = !currentAgent || currentAgent.status === 'inactive';

      // Override specific request if details provided from live transcript
      if (agentObj.details) {
        if (agentDetails) {
          agentDetails.specificRequest = agentObj.details;
          agentDetails.price = 'Market Price'; // Fix: Reset price for dynamic requests
          isUnavailable = false;
        }

        // Immediate UI update for details
        setLiveAgents(prev => prev.map(a =>
          a.type === type
            ? {
              ...a,
              requestDetails: { ...a.requestDetails!, specificRequest: agentObj.details },
              // Also update the description if it's displaying the request
              steps: a.steps.map(s => ({
                ...s,
                details: s.label.startsWith('Searching') ? `Request: ${agentObj.details}` : s.details
              }))
            }
            : a
        ));
      }

      // If it's ONLY a detail update (and not a new agent or action advance), stop here
      // This prevents restarting the animation loop
      if (!isNew && agentObj.action !== 'finalize' && currentAgent?.status !== 'success') {
        return;
      }

      // If it's a NEW agent (not an update), initialize it
      if (isNew) {
        setTimeout(() => {
          setLiveAgents(prev => prev.map(a =>
            a.type === type
              ? {
                ...a,
                status: 'in_progress' as const,
                currentStep: stepConfigs[0]?.label || 'Initializing...',
                requestDetails: agentDetails,
                steps: a.steps.map((s, i) => ({
                  ...s,
                  status: i === 0 ? 'in_progress' as const : 'pending' as const,
                  details: s.label === 'Searching menu options' || s.label === 'Searching fuel providers' || s.label === 'Searching wine cellar' || s.label === 'Searching vehicles'
                    ? `Request: ${agentDetails?.specificRequest}`
                    : s.details
                })),
              }
              : a
          ));
        }, delay);
      }

      // Progress steps based on action
      // search -> steps 0, 1
      // finalize -> steps 2, 3
      const stepDuration = 3500;
      const failAtStep = shouldFail ? Math.floor(stepConfigs.length / 2) : -1;

      // Determine start step index based on action
      // If we are finalizing, we might want to skip steps 0 and 1 if they are done?
      // Or just re-run ensure they are marked done.
      // Simplification: Iterate all, but only schedule if appropriate

      stepConfigs.forEach((stepConfig, stepIndex) => {
        // If searching, stop after step 1
        if (action === 'search' && stepIndex > 1) return;

        // Calculate delay
        // If finalizing, we want to start immediately for remaining steps?
        // Let's keep simpler logic: Calculate absolute time from start.
        const stepDelay = delay + 400 + (stepIndex * stepDuration);

        setTimeout(() => {
          // Check for failure
          if (shouldFail && stepIndex === failAtStep) {
            // ... failure logic (omitted for brevity, assume safe to copy from original if needed, but for now using simplified failure)
            // Copying failure logic is safer
            setLiveAgents(prev => prev.map(a =>
              a.type === type
                ? {
                  ...a,
                  status: 'failed' as const,
                  currentStep: agentDetails?.unavailableMessage || 'Service unavailable',
                  steps: a.steps.map((s, i) => ({
                    ...s,
                    status: i < stepIndex ? 'completed' as const : (i === stepIndex ? 'in_progress' as const : 'pending' as const),
                  })),
                  result: {
                    vendor: agentVendors[type]?.name || 'N/A',
                    price: 'N/A', // fallback
                    details: 'Service unavailable',
                    specificRequest: agentDetails?.specificRequest,
                    alternatives: agentDetails?.alternatives,
                    unavailableMessage: agentDetails?.unavailableMessage
                  } as any
                }
                : a
            ));
            onAgentComplete(type, false);
            return;
          }

          // Handle unavailable items
          if (isUnavailable && stepIndex === stepConfigs.length - 1) {
            // ... unavailable logic
            setLiveAgents(prev => prev.map(a =>
              a.type === type
                ? {
                  ...a,
                  status: 'unavailable' as const,
                  currentStep: 'Item unavailable - alternatives found',
                  progress: 100,
                  steps: a.steps.map(s => ({ ...s, status: 'completed' as const })),
                  result: {
                    vendor: agentVendors[type]?.name || 'N/A',
                    price: 'N/A',
                    details: 'Alternatives available',
                    specificRequest: agentDetails?.specificRequest,
                    alternatives: agentDetails?.alternatives
                  } as any,
                  searchResults: [agentDetails?.specificRequest || '', ...(agentDetails?.alternatives || [])],
                  availabilityInfo: [],
                }
                : a
            ));
            onAgentComplete(type, true, {
              vendor: agentVendors[type]?.name || 'N/A',
              price: 'N/A',
              details: 'With alternatives',
              specificRequest: agentDetails?.specificRequest,
            } as any);
            return;
          }

          // Normal progress
          const isComplete = stepIndex === stepConfigs.length - 1;
          const isPaused = action === 'search' && stepIndex === 1;

          setLiveAgents(prev => prev.map(a =>
            a.type === type && a.status !== 'failed' && a.status !== 'unavailable'
              ? {
                ...a,
                // If purely "search" action, stay 'in_progress' at step 1.
                currentStep: isPaused ? 'Waiting for confirmation...' : stepConfig.label,
                progress: ((stepIndex + 1) / stepConfigs.length) * 100,
                status: isComplete ? 'success' as const : 'in_progress' as const,
                steps: a.steps.map((s, i) => {
                  let stepStatus: 'pending' | 'in_progress' | 'completed' = 'pending';
                  if (i < stepIndex) stepStatus = 'completed';
                  else if (i === stepIndex) stepStatus = (isComplete || isPaused) ? 'completed' : 'in_progress';
                  return { ...s, status: stepStatus };
                }),
                selectedOption: isComplete ? agentDetails?.specificRequest : undefined,
                result: isComplete ? {
                  vendor: agentVendors[type]?.name || 'N/A',
                  price: agentDetails?.price || 'Market Price',
                  details: 'Confirmed',
                  specificRequest: agentDetails?.specificRequest,
                } : undefined,
                searchResults: stepIndex >= 1 ? [agentDetails?.specificRequest || ''] : [],
                availabilityInfo: stepIndex >= 1 ? [
                  { item: agentDetails?.specificRequest || 'Requested item', available: true },
                ] : [],
              }
              : a
          ));

          if (isComplete) {
            onAgentComplete(type, true, {
              vendor: agentVendors[type]?.name || 'N/A',
              price: agentDetails?.price || 'Market Price',
              specificRequest: agentDetails?.specificRequest,
              details: 'Confirmed',
            });
          }
        }, stepDelay);
      });
    });
  }, [activeAgents]);

  // Sync selectedAgent with liveAgents
  useEffect(() => {
    if (selectedAgent) {
      const updated = liveAgents.find(a => a.type === selectedAgent.type);
      if (updated && updated.status !== selectedAgent.status) {
        setSelectedAgent(updated);
      }
    }
  }, [liveAgents, selectedAgent?.type]);

  // Handle accepted alternatives from conversation (pilot says "Yes, the alternative sounds good")
  useEffect(() => {
    if (acceptedAlternatives.length === 0) return;

    acceptedAlternatives.forEach(({ agentType, alternative }) => {
      setLiveAgents(prev => prev.map(a =>
        a.type === agentType && (a.status === 'unavailable' || a.status === 'in_progress')
          ? {
            ...a,
            status: 'success' as const,
            currentStep: 'Alternative confirmed',
            selectedOption: alternative,
            steps: a.steps.map(s => ({ ...s, status: 'completed' as const })),
            result: {
              ...a.result!,
              acceptedAlternative: alternative,
            }
          }
          : a
      ));
    });
  }, [acceptedAlternatives]);

  const activeCount = liveAgents.filter(a => a.status === 'in_progress').length;
  const completedCount = liveAgents.filter(a => a.status === 'success').length;
  const unavailableCount = liveAgents.filter(a => a.status === 'unavailable').length;
  const failedCount = liveAgents.filter(a => a.status === 'failed').length;
  const triggeredCount = activeAgents.length;

  // Check for Urgent/Critical Agent
  const urgentAgent = activeAgents.find(a => a.id === 'urgent');
  const isCriticalMode = !!urgentAgent;

  if (isCriticalMode) {
    return (
      <div className="flex flex-col h-full bg-destructive/5 items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center mb-6 animate-pulse">
          <AlertTriangle className="w-12 h-12 text-destructive" />
        </div>

        <h2 className="text-2xl font-bold text-destructive mb-2 tracking-tight">TRANSFERRING CALL...</h2>

        <div className="bg-background border-2 border-destructive/50 rounded-xl p-6 shadow-xl max-w-sm w-full">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Emergency Reason</p>
          <p className="text-lg font-medium text-destructive mb-6">
            "{urgentAgent?.details || 'Unknown Emergency'}"
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 p-3 bg-destructive/10 rounded-lg animate-pulse">
              <UserCog className="w-5 h-5 text-destructive" />
              <span className="font-bold text-destructive">Connecting to Duty Manager...</span>
            </div>

            <p className="text-xs text-muted-foreground">
              Automated agents have been suspended.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="w-5 h-5 text-primary" />
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            )}
          </div>
          <h3 className="font-semibold text-foreground">Agent Activity</h3>
        </div>
        {activeCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-orange-500 font-medium">
            <Zap className="w-3 h-3" />
            <span>{activeCount} working</span>
          </div>
        )}
      </div>

      {/* Progress Summary - Only show when agents are triggered */}
      {triggeredCount > 0 && (
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {failedCount > 0 && (
                <span className="text-destructive">{failedCount} failed • </span>
              )}
              {unavailableCount > 0 && (
                <span className="text-orange-500">{unavailableCount} pending • </span>
              )}
              <span className="text-green-500">{completedCount}</span>
              <span className="text-muted-foreground"> / {triggeredCount} complete</span>
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500 ease-out",
                failedCount > 0
                  ? "bg-gradient-to-r from-destructive to-orange-500"
                  : "bg-gradient-to-r from-orange-500 to-green-500"
              )}
              style={{ width: `${triggeredCount > 0 ? ((completedCount + failedCount + unavailableCount) / triggeredCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Agent Cards - Always show all 4 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {liveAgents.map((agent) => {
          const Icon = agentIcons[agent.type] || Bot;
          const isInactive = agent.status === 'inactive';
          const isActive = agent.status === 'in_progress';
          const isSuccess = agent.status === 'success';
          const isUnavailable = agent.status === 'unavailable';
          const isFailed = agent.status === 'failed';
          const hasDetails = agent.requestDetails !== undefined;

          // Luxurious color scheme with gradients
          const getBorderColor = () => {
            if (isInactive) return 'border-border/30';
            if (isActive || isUnavailable) return 'border-amber-500/40';
            if (isSuccess) return 'border-emerald-500/40';
            if (isFailed) return 'border-destructive/40';
            return 'border-border';
          };

          const getBgColor = () => {
            if (isInactive) return 'bg-gradient-to-br from-muted/30 to-muted/10';
            if (isActive || isUnavailable) return 'bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20';
            if (isSuccess) return 'bg-gradient-to-br from-emerald-50 to-green-50/50 dark:from-emerald-950/30 dark:to-green-950/20';
            if (isFailed) return 'bg-gradient-to-br from-red-50 to-destructive/10 dark:from-red-950/30 dark:to-destructive/20';
            return 'bg-background';
          };

          const getShadow = () => {
            if (isActive || isUnavailable) return 'shadow-lg shadow-amber-500/10';
            if (isSuccess) return 'shadow-lg shadow-emerald-500/10';
            if (isFailed) return 'shadow-lg shadow-destructive/10';
            return '';
          };

          return (
            <div
              key={agent.id}
              className={cn(
                'relative rounded-2xl border-2 transition-all duration-300 backdrop-blur-sm',
                getBorderColor(),
                getBgColor(),
                getShadow(),
                isInactive && 'opacity-60',
                'cursor-pointer hover:shadow-xl hover:scale-[1.01] hover:-translate-y-0.5'
              )}
              onClick={() => openAgentDialog(agent)}
            >
              {/* Agent Header */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={cn(
                      'relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 shrink-0',
                      isInactive && 'bg-muted/60',
                      (isActive || isUnavailable) && 'bg-gradient-to-br from-amber-500/20 to-orange-500/30 shadow-lg shadow-orange-500/10',
                      isSuccess && 'bg-gradient-to-br from-emerald-500/20 to-green-500/30 shadow-lg shadow-green-500/10',
                      isFailed && 'bg-gradient-to-br from-red-500/20 to-destructive/30 shadow-lg shadow-destructive/10'
                    )}
                  >
                    {isActive ? (
                      <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                    ) : isSuccess ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : isUnavailable ? (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    ) : isFailed ? (
                      <XCircle className="w-5 h-5 text-destructive" />
                    ) : (
                      <Icon className={cn("w-5 h-5", isInactive ? "text-muted-foreground/40" : "text-muted-foreground")} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title Row */}
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={cn(
                        'font-semibold text-sm tracking-tight',
                        isInactive && 'text-muted-foreground/60',
                        (isActive || isUnavailable) && 'text-amber-600',
                        isSuccess && 'text-emerald-600',
                        isFailed && 'text-destructive'
                      )}>
                        {agent.name}
                      </h4>

                      {/* Status Badge */}
                      {isInactive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground/60 uppercase tracking-wider font-medium">
                          {hasDetails ? 'Standby' : 'N/A'}
                        </span>
                      )}
                      {agent.result?.specialOrder && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 font-semibold uppercase tracking-wide">
                          Special Order
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className={cn(
                      'text-xs mt-1 leading-relaxed',
                      isInactive && 'text-muted-foreground/40',
                      (isActive || isUnavailable) && 'text-amber-600/70',
                      isSuccess && 'text-emerald-600/70',
                      isFailed && 'text-destructive/70'
                    )}>
                      {isInactive
                        ? 'Waiting for request...'
                        : isActive
                          ? agent.currentStep
                          : (agent.selectedOption || agent.requestDetails?.specificRequest || agent.currentStep)
                      }
                    </p>

                    {/* Price - On its own row */}
                    {(isSuccess || isUnavailable) && agent.result?.price && (
                      <div className={cn(
                        "mt-2 text-sm font-bold tracking-tight",
                        isSuccess ? "text-emerald-600" : "text-amber-600"
                      )}>
                        {agent.result.price}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar - Only for active agents */}
              {isActive && (
                <div className="mx-4 mb-4 h-1.5 bg-muted/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ease-out"
                    style={{ width: `${agent.progress}%` }}
                  />
                </div>
              )}

              {/* Mini step indicators for completed/active agents */}
              {(isSuccess || isActive || isUnavailable) && (
                <div className="px-4 pb-4 flex gap-1.5">
                  {agent.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex-1 h-1.5 rounded-full transition-all duration-300',
                        step.status === 'completed' && 'bg-gradient-to-r from-emerald-500 to-green-500',
                        step.status === 'in_progress' && 'bg-gradient-to-r from-amber-500 to-orange-500',
                        step.status === 'pending' && 'bg-muted/60'
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Active glow effect */}
              {isActive && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 animate-pulse pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {activeCount > 0 && (
        <div className="p-4 border-t border-border bg-orange-500/5">
          <p className="text-xs text-orange-500 text-center font-medium">
            {activeCount} agent{activeCount > 1 ? 's' : ''} processing in parallel...
          </p>
        </div>
      )}

      {failedCount > 0 && activeCount === 0 && (
        <div className="p-4 border-t border-border bg-destructive/5">
          <p className="text-xs text-destructive text-center font-medium">
            {failedCount} agent{failedCount > 1 ? 's' : ''} failed - human intervention required
          </p>
        </div>
      )}

      {/* Agent Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedAgent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    selectedAgent.status === 'inactive' && 'bg-muted/50',
                    selectedAgent.status === 'in_progress' && 'bg-orange-500/20',
                    selectedAgent.status === 'success' && 'bg-green-500/20',
                    selectedAgent.status === 'unavailable' && 'bg-orange-500/20',
                    selectedAgent.status === 'failed' && 'bg-destructive/20'
                  )}>
                    {selectedAgent.status === 'inactive' ? (
                      React.createElement(agentIcons[selectedAgent.type] || Bot, { className: 'w-5 h-5 text-muted-foreground' })
                    ) : selectedAgent.status === 'in_progress' ? (
                      <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                    ) : selectedAgent.status === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : selectedAgent.status === 'unavailable' ? (
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <DialogTitle className={cn(
                      selectedAgent.status === 'inactive' && 'text-muted-foreground',
                      selectedAgent.status === 'in_progress' && 'text-orange-500',
                      selectedAgent.status === 'success' && 'text-green-500',
                      selectedAgent.status === 'unavailable' && 'text-orange-500',
                      selectedAgent.status === 'failed' && 'text-destructive'
                    )}>
                      {selectedAgent.name}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedAgent.status === 'inactive' && (selectedAgent.requestDetails ? 'Waiting to be triggered' : 'Not requested for this order')}
                      {selectedAgent.status === 'in_progress' && 'Processing request...'}
                      {selectedAgent.status === 'success' && 'Request completed successfully'}
                      {selectedAgent.status === 'unavailable' && 'Item unavailable - alternatives available'}
                      {selectedAgent.status === 'failed' && 'Request failed - requires intervention'}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                {/* Request Details */}
                {selectedAgent.requestDetails?.specificRequest && (
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Package className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Original Request</span>
                      <span className="text-sm font-medium">{selectedAgent.requestDetails.specificRequest}</span>
                    </div>
                  </div>
                )}

                {/* Step Progress */}
                {selectedAgent.status !== 'inactive' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ListChecks className="w-3.5 h-3.5" />
                      <span>Processing Steps</span>
                    </div>
                    <div className="space-y-1.5">
                      {selectedAgent.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'flex items-center gap-2 p-2 rounded-lg text-sm transition-colors',
                            step.status === 'completed' && 'bg-green-500/10',
                            step.status === 'in_progress' && 'bg-orange-500/10',
                            step.status === 'pending' && 'bg-muted/30'
                          )}
                        >
                          {step.status === 'completed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          ) : step.status === 'in_progress' ? (
                            <Loader2 className="w-3.5 h-3.5 text-orange-500 animate-spin flex-shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <span className={cn(
                              step.status === 'completed' && 'text-green-600 dark:text-green-400',
                              step.status === 'in_progress' && 'text-orange-600 dark:text-orange-400',
                              step.status === 'pending' && 'text-muted-foreground'
                            )}>
                              {step.label}
                            </span>
                            {step.details && step.status !== 'pending' && (
                              <p className="text-xs text-muted-foreground mt-0.5">{step.details}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Results / Availability */}
                {selectedAgent.availabilityInfo && selectedAgent.availabilityInfo.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Search className="w-3.5 h-3.5" />
                      <span>Availability Check</span>
                    </div>
                    <div className="space-y-1.5">
                      {selectedAgent.availabilityInfo.map((info, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'flex items-center justify-between p-2 rounded-lg text-sm',
                            info.available ? 'bg-green-500/10' : 'bg-destructive/10'
                          )}
                        >
                          <span className={info.available ? 'text-foreground' : 'text-muted-foreground line-through'}>
                            {info.item}
                          </span>
                          <span className={cn(
                            'text-xs font-medium',
                            info.available ? 'text-green-500' : 'text-destructive'
                          )}>
                            {info.available ? '✓ Available' : '✗ Unavailable'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Option */}
                {selectedAgent.selectedOption && selectedAgent.status === 'success' && (
                  <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Selected</span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {selectedAgent.selectedOption}
                      </span>
                      {selectedAgent.result?.specialOrder && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-orange-500">
                          <Truck className="w-3 h-3" />
                          <span>Special Order - ETA: {selectedAgent.result.specialOrderEta}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Success State - Vendor & Price */}
                {selectedAgent.status === 'success' && selectedAgent.result && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg">
                      <ShoppingCart className="w-4 h-4 text-green-500 mt-0.5" />
                      <div>
                        <span className="text-xs text-muted-foreground block">Vendor</span>
                        <span className="text-sm font-medium">{selectedAgent.result.vendor}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg">
                      <DollarSign className="w-4 h-4 text-green-500 mt-0.5" />
                      <div>
                        <span className="text-xs text-muted-foreground block">Price</span>
                        <span className="text-sm font-semibold text-green-500">{selectedAgent.result.price}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Unavailable State - Show alternatives */}
                {selectedAgent.status === 'unavailable' && selectedAgent.result && (
                  <div className="space-y-3">
                    <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <Info className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-orange-600 dark:text-orange-400">
                          {selectedAgent.result.unavailableMessage}
                        </p>
                      </div>
                    </div>

                    {selectedAgent.result.alternatives && selectedAgent.result.alternatives.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs text-muted-foreground font-medium">Select an Alternative:</span>
                        <RadioGroup className="space-y-2">
                          {selectedAgent.result.alternatives.map((alt, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleAcceptAlternative(selectedAgent.type, alt)}
                              className="flex items-center gap-3 p-3 bg-muted/50 hover:bg-green-500/10 rounded-lg border border-transparent hover:border-green-500/50 transition-all cursor-pointer group"
                            >
                              <RadioGroupItem value={alt} id={`alt-${idx}`} className="group-hover:border-green-500" />
                              <Label htmlFor={`alt-${idx}`} className="flex-1 cursor-pointer text-sm">
                                {alt}
                              </Label>
                              <span className="text-xs text-green-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                Select
                              </span>
                            </div>
                          ))}
                        </RadioGroup>

                        {/* Special Order Option */}
                        <div className="pt-2 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-orange-500 border-orange-500/50 hover:bg-orange-500/10"
                            onClick={() => handlePlaceSpecialOrder(selectedAgent.type, selectedAgent.requestDetails?.specificRequest || 'Original item')}
                          >
                            <Truck className="w-4 h-4 mr-2" />
                            Place Special Order for Original Item
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1 text-center">
                            ETA: 4-6 hours • Additional charges may apply
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedAgent.result.timeConstraint && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs">{selectedAgent.result.timeConstraint}</span>
                      </div>
                    )}

                    {selectedAgent.result.price && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="text-xs">Pricing: {selectedAgent.result.price}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Failed State */}
                {selectedAgent.status === 'failed' && selectedAgent.result && (
                  <div className="space-y-3">
                    <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                      <div className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-destructive">
                          {selectedAgent.result.unavailableMessage || 'Service unavailable'}
                        </p>
                      </div>
                    </div>

                    {selectedAgent.result.alternatives && selectedAgent.result.alternatives.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs text-muted-foreground font-medium">Available Alternatives:</span>
                        {selectedAgent.result.alternatives.map((alt, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                            <span className="text-sm">{alt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedAgent.result.timeConstraint && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs">{selectedAgent.result.timeConstraint}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t">
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                      >
                        <UserCog className="w-4 h-4 mr-2" />
                        Assign to Human Agent
                      </Button>
                    </div>
                  </div>
                )}

                {/* In Progress State */}
                {selectedAgent.status === 'in_progress' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-lg">
                      <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                      <span className="text-sm text-orange-500">{selectedAgent.currentStep}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 transition-all duration-500"
                        style={{ width: `${selectedAgent.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {Math.round(selectedAgent.progress)}% complete
                    </p>
                  </div>
                )}

                {/* Inactive State */}
                {selectedAgent.status === 'inactive' && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">
                      {selectedAgent.requestDetails
                        ? 'This agent is on standby and will activate when the pilot confirms the request.'
                        : 'This service was not requested for this order.'}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

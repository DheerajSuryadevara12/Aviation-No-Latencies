import { useState, useEffect, useRef } from 'react';
import { Order } from '@/types/aviation';
import { cn } from '@/lib/utils';
import { MessageSquare, Bot, User, Phone, PhoneCall, AlertTriangle, Info } from 'lucide-react';
import { getConversationForOrder, ConversationStep, AgentRequestDetails } from '@/data/conversationScripts';

interface Message {
  id: string;
  role: 'pilot' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  triggersAgents?: string[];
  agentDetails?: AgentRequestDetails[];
  isError?: boolean;
}

interface LiveConversationPanelProps {
  order: Order;
  onAgentTriggered: (agentIds: string[]) => void;
  onAgentComplete: (agentId: string, success: boolean) => void;
  onConversationComplete: () => void;
  onMessagesUpdate: (messages: Message[]) => void;
  onAlternativeAccepted?: (agentType: string, alternative: string) => void;
  isSimulating: boolean;
  isConnected?: boolean; // New prop for live connection status
  messages?: Message[]; // New prop for external messages
  completedAgents: { id: string; success: boolean; result?: any }[];
  failedAgents: string[];
}

export function LiveConversationPanel({
  order,
  onAgentTriggered,
  onAgentComplete,
  onConversationComplete,
  onMessagesUpdate,
  onAlternativeAccepted,
  isSimulating,
  isConnected = false,
  messages: externalMessages,
  completedAgents,
  failedAgents
}: LiveConversationPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [waitingForAgents, setWaitingForAgents] = useState(false);
  const [pendingAgents, setPendingAgents] = useState<string[]>([]);
  const [pendingAgentDetails, setPendingAgentDetails] = useState<AgentRequestDetails[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Track if we're syncing from external to avoid loop
  const isSyncingFromExternal = useRef(false);

  // Notify parent of message updates (only for internal changes)
  useEffect(() => {
    if (!isSyncingFromExternal.current) {
      onMessagesUpdate(messages);
    }
    isSyncingFromExternal.current = false;
  }, [messages, onMessagesUpdate]);

  // Sync external messages
  useEffect(() => {
    if (externalMessages && externalMessages.length > 0) {
      // Only sync if actually different (by length and last message)
      const lastExternal = externalMessages[externalMessages.length - 1];
      const lastInternal = messages[messages.length - 1];
      if (externalMessages.length !== messages.length ||
        (lastExternal && lastInternal && lastExternal.id !== lastInternal.id)) {
        isSyncingFromExternal.current = true;
        setMessages(externalMessages);
      }
    }
  }, [externalMessages]);

  // Get conversation flow for this specific order
  const conversationFlow = getConversationForOrder(order);

  // Run conversation flow
  useEffect(() => {
    if (!isSimulating) return;
    if (currentStep >= conversationFlow.length) return;
    if (waitingForAgents) return;

    const step = conversationFlow[currentStep];

    // Show typing indicator before agent messages
    let typingTimeout: NodeJS.Timeout | undefined;
    if (step.message.role === 'agent' && currentStep > 0) {
      typingTimeout = setTimeout(() => {
        setIsTyping(true);
      }, Math.max(0, step.delay - 300));
    }

    const messageTimeout = setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { ...step.message, timestamp: new Date() }]);

      // Trigger agents if specified
      if (step.message.triggersAgents && step.message.triggersAgents.length > 0) {
        onAgentTriggered(step.message.triggersAgents);
        setPendingAgents(step.message.triggersAgents);
        setPendingAgentDetails(step.message.agentDetails || []);
      }

      // Check if we need to wait for agents
      if (step.waitForAgents) {
        setWaitingForAgents(true);
      }

      setCurrentStep(prev => prev + 1);
    }, step.delay);

    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
      clearTimeout(messageTimeout);
    };
  }, [isSimulating, currentStep, waitingForAgents, conversationFlow]);

  // Handle agent completion - add summary message with unavailability handling
  useEffect(() => {
    if (!waitingForAgents || pendingAgents.length === 0) return;

    // Check if all pending agents have completed
    const allCompleted = pendingAgents.every(agentId =>
      completedAgents.some(ca => ca.id === agentId) || failedAgents.includes(agentId)
    );

    if (allCompleted) {
      setWaitingForAgents(false);

      // Check for failures (Diana Prince scenario)
      const hasFailures = pendingAgents.some(id => failedAgents.includes(id));

      // Check for unavailable items (Charlie Brown caviar scenario)
      const unavailableItems = pendingAgentDetails.filter(d => d.unavailable && !failedAgents.includes(d.agentType));

      if (hasFailures) {
        // Complete failure - escalate to human
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);

            // Find the failed agent details
            const failedAgent = pendingAgentDetails.find(d => failedAgents.includes(d.agentType));

            let failureMessage = 'I apologize, but I encountered an issue with one of your requests.';
            if (failedAgent?.unavailableMessage) {
              failureMessage = failedAgent.unavailableMessage;
            }

            setMessages(prev => [...prev, {
              id: 'msg-failure',
              role: 'agent',
              content: failureMessage,
              timestamp: new Date(),
              isError: true,
            }]);

            // If there are alternatives, show them
            if (failedAgent?.alternatives && failedAgent.alternatives.length > 0) {
              setTimeout(() => {
                setMessages(prev => [...prev, {
                  id: 'msg-alternatives',
                  role: 'agent',
                  content: `However, I have some alternatives: ${failedAgent.alternatives?.join(', ')}. ${failedAgent.timeConstraint ? `Timing: ${failedAgent.timeConstraint}.` : ''} ${failedAgent.price ? `Pricing: ${failedAgent.price}.` : ''} I'm escalating to a human agent to complete your booking.`,
                  timestamp: new Date(),
                  isError: true,
                }]);

                setTimeout(() => {
                  setMessages(prev => [...prev, {
                    id: 'msg-escalate',
                    role: 'system',
                    content: '⚠️ Call escalated to human agent - Marcus Thompson (ID: GS-001)',
                    timestamp: new Date(),
                    isError: true,
                  }]);
                  onConversationComplete();
                }, 600);
              }, 800);
            } else {
              setTimeout(() => {
                setMessages(prev => [...prev, {
                  id: 'msg-escalate',
                  role: 'system',
                  content: '⚠️ Call escalated to human agent - Marcus Thompson (ID: GS-001)',
                  timestamp: new Date(),
                  isError: true,
                }]);
                onConversationComplete();
              }, 600);
            }
          }, 400);
        }, 300);
      } else if (unavailableItems.length > 0) {
        // Some items unavailable but we can proceed with alternatives
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);

            // Build the unavailability message
            const unavailableMessages = unavailableItems.map(item => {
              let msg = item.unavailableMessage || `${item.specificRequest} is currently unavailable.`;
              if (item.alternatives && item.alternatives.length > 0) {
                msg += ` May I suggest: ${item.alternatives[0]}?`;
              }
              return msg;
            });

            setMessages(prev => [...prev, {
              id: 'msg-unavailable',
              role: 'agent',
              content: `${order.customer?.pilotName?.split(' ')[0] || 'Captain'}, I have an update. ${unavailableMessages.join(' ')}`,
              timestamp: new Date(),
            }]);

            // Pilot responds
            setTimeout(() => {
              setMessages(prev => [...prev, {
                id: 'msg-pilot-accept',
                role: 'pilot',
                content: 'Yes, the alternative sounds good. Please proceed with that.',
                timestamp: new Date(),
              }]);

              // Notify parent that alternatives were accepted - this updates agent to green
              unavailableItems.forEach(item => {
                if (item.alternatives && item.alternatives.length > 0) {
                  onAlternativeAccepted?.(item.agentType, item.alternatives[0]);
                }
              });

              // Build success summary
              setTimeout(() => {
                setIsTyping(true);
                setTimeout(() => {
                  setIsTyping(false);

                  const summaryParts: string[] = [];
                  completedAgents.forEach(agent => {
                    if (pendingAgents.includes(agent.id) && agent.result) {
                      summaryParts.push(`${agent.result.specificRequest || agent.id}: ${agent.result.price || 'confirmed'}`);
                    }
                  });

                  setMessages(prev => [...prev, {
                    id: 'msg-summary',
                    role: 'agent',
                    content: `Perfect! I've updated your order. All confirmed: ${summaryParts.join('; ')}. Everything will be ready for your arrival!`,
                    timestamp: new Date(),
                  }]);

                  // End conversation
                  setTimeout(() => {
                    setMessages(prev => [...prev, {
                      id: 'msg-thanks',
                      role: 'pilot',
                      content: 'Excellent, thank you for handling that!',
                      timestamp: new Date(),
                    }]);

                    setTimeout(() => {
                      setMessages(prev => [...prev, {
                        id: 'msg-goodbye',
                        role: 'agent',
                        content: 'You\'re welcome! Safe travels. Goodbye!',
                        timestamp: new Date(),
                      }]);

                      setTimeout(() => {
                        setMessages(prev => [...prev, {
                          id: 'msg-call-end',
                          role: 'system',
                          content: 'Call ended - All services confirmed ✓',
                          timestamp: new Date(),
                        }]);
                        onConversationComplete();
                      }, 500);
                    }, 600);
                  }, 800);
                }, 400);
              }, 600);
            }, 1000);
          }, 400);
        }, 300);
      } else {
        // All success - build summary of completed services
        const summaryParts: string[] = [];
        completedAgents.forEach(agent => {
          if (pendingAgents.includes(agent.id) && agent.result) {
            if (agent.result.specificRequest) {
              summaryParts.push(`${agent.result.specificRequest} - ${agent.result.price || 'confirmed'}`);
            } else if (agent.id === 'refueling') {
              summaryParts.push(`refueling at ${agent.result.price}`);
            } else if (agent.id === 'catering') {
              summaryParts.push(`catering (${agent.result.price})`);
            } else if (agent.id === 'wine') {
              summaryParts.push(`wine selection (${agent.result.price})`);
            } else if (agent.id === 'car_rental') {
              summaryParts.push(`transport (${agent.result.price})`);
            }
          }
        });

        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, {
              id: 'msg-summary',
              role: 'agent',
              content: `Wonderful news, ${order.customer?.pilotName?.split(' ')[0] || 'Captain'}! Everything confirmed: ${summaryParts.join('; ')}. All set for your arrival!`,
              timestamp: new Date(),
            }]);

            // Pilot thanks and ends call
            setTimeout(() => {
              setMessages(prev => [...prev, {
                id: 'msg-thanks',
                role: 'pilot',
                content: 'That\'s excellent, thank you!',
                timestamp: new Date(),
              }]);

              setTimeout(() => {
                setMessages(prev => [...prev, {
                  id: 'msg-goodbye',
                  role: 'agent',
                  content: 'You\'re welcome! Safe travels. Goodbye!',
                  timestamp: new Date(),
                }]);

                setTimeout(() => {
                  setMessages(prev => [...prev, {
                    id: 'msg-call-end',
                    role: 'system',
                    content: 'Call ended - All services confirmed ✓',
                    timestamp: new Date(),
                  }]);
                  onConversationComplete();
                }, 500);
              }, 600);
            }, 800);
          }, 400);
        }, 300);
      }
    }
  }, [completedAgents, failedAgents, waitingForAgents, pendingAgents, pendingAgentDetails, order]);

  // Reset only when explicitly starting a new simulation (not when ending)
  // We track this by checking if isSimulating transitions from false to true
  const prevIsSimulating = useRef(isSimulating);
  useEffect(() => {
    // Only reset when starting a NEW simulation (transition from false to true)
    if (isSimulating && !prevIsSimulating.current) {
      setMessages([]);
      setCurrentStep(0);
      setWaitingForAgents(false);
      setPendingAgents([]);
      setPendingAgentDetails([]);
    }
    prevIsSimulating.current = isSimulating;
  }, [isSimulating]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <div className="relative">
          <Phone className="w-5 h-5 text-primary" />
          {(isSimulating || isConnected) && messages.length > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-success rounded-full animate-pulse" />
          )}
        </div>
        <h3 className="font-semibold text-foreground">Live Call</h3>
        {(isSimulating || isConnected) && messages.length > 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-success font-medium">
            <PhoneCall className="w-3 h-3" />
            Connected
          </span>
        )}
      </div>

      {/* Empty State */}
      {messages.length === 0 && !isSimulating && !isConnected && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Phone className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground text-sm">
            Click "Start Live Demo" to simulate<br />a pilot call in real-time
          </p>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3 animate-fade-in',
                message.role === 'pilot' && 'flex-row-reverse'
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                  message.role === 'pilot' && 'bg-primary/20 text-primary',
                  message.role === 'agent' && !message.isError && 'bg-info/20 text-info',
                  message.role === 'agent' && message.isError && 'bg-destructive/20 text-destructive',
                  message.role === 'system' && !message.isError && 'bg-muted text-muted-foreground',
                  message.role === 'system' && message.isError && 'bg-warning/20 text-warning'
                )}
              >
                {message.role === 'pilot' ? (
                  <User className="w-3.5 h-3.5" />
                ) : message.role === 'agent' ? (
                  message.isError ? <AlertTriangle className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />
                ) : (
                  message.isError ? <AlertTriangle className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={cn(
                  'max-w-[75%] rounded-xl px-3 py-2',
                  message.role === 'pilot' && 'bg-primary text-primary-foreground',
                  message.role === 'agent' && !message.isError && 'bg-muted border border-border',
                  message.role === 'agent' && message.isError && 'bg-destructive/10 border border-destructive/30 text-destructive',
                  message.role === 'system' && !message.isError && 'bg-muted/50 text-muted-foreground text-xs italic',
                  message.role === 'system' && message.isError && 'bg-warning/10 border border-warning/30 text-warning-foreground text-xs font-medium'
                )}
              >
                <p className="text-sm">{message.content}</p>
                <p className={cn(
                  'text-[10px] mt-1',
                  message.role === 'pilot' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                )}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-7 h-7 rounded-full bg-info/20 text-info flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-muted border border-border rounded-xl px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Waiting for agents indicator */}
          {waitingForAgents && !isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-7 h-7 rounded-full bg-info/20 text-info flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-info/10 border border-info/30 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-info">
                  <div className="flex gap-0.5">
                    <span className="w-1 h-1 bg-info rounded-full animate-pulse" />
                    <span className="w-1 h-1 bg-info rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                    <span className="w-1 h-1 bg-info rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                  </div>
                  <span>Coordinating services...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}

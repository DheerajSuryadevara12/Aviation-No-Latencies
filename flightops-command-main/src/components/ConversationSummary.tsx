import { useState } from 'react';
import { Order } from '@/types/aviation';
import { MessageSquare, Target, CheckCircle2, ArrowRight, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConversationSummaryProps {
  order: Order;
  compact?: boolean;
}

// Mock transcript data - in a real app this would come from the order
function generateMockTranscript(order: Order) {
  return [
    {
      role: 'pilot' as const,
      content: `Please schedule me a reservation for flight number ${order.customer.planeNumber} for ${order.customer.name}.`,
      timestamp: new Date(order.createdAt.getTime() - 5 * 60000),
    },
    {
      role: 'agent' as const,
      content: `Absolutely, let me help you with that. I'm checking availability and pulling up your records now.`,
      timestamp: new Date(order.createdAt.getTime() - 4 * 60000),
    },
    {
      role: 'agent' as const,
      content: `I found your customer profile. You have ${order.passengers} passengers listed. I see you've requested: ${order.items.map(i => i.type.replace('_', ' ')).join(', ')}.`,
      timestamp: new Date(order.createdAt.getTime() - 3 * 60000),
    },
    {
      role: 'pilot' as const,
      content: order.specialRequests || 'That sounds correct. Please proceed with the reservation.',
      timestamp: new Date(order.createdAt.getTime() - 2 * 60000),
    },
    {
      role: 'agent' as const,
      content: `Perfect! I've confirmed all services. Your reservation is now ${order.status}. Is there anything else I can help you with?`,
      timestamp: new Date(order.createdAt.getTime() - 1 * 60000),
    },
  ];
}

// Generate a conversation summary based on order data
function generateSummary(order: Order) {
  const services = order.items.map(item => {
    const labels: Record<string, string> = {
      refueling: 'Fuel Service',
      catering: 'Catering',
      wine: 'Wine/Champagne',
      car_rental: 'Ground Transport',
      dry_cleaning: 'Dry Cleaning',
      special_request: 'Special Request',
    };
    return labels[item.type] || item.type;
  });

  const completedCount = order.agents.filter(a => a.status === 'success').length;
  const failedCount = order.agents.filter(a => a.status === 'failed').length;
  const inProgressCount = order.agents.filter(a => a.status === 'in_progress').length;

  let nextAction = 'Awaiting processing';
  if (failedCount > 0) {
    nextAction = 'Manual intervention required';
  } else if (inProgressCount > 0) {
    nextAction = 'Processing services';
  } else if (completedCount === order.agents.length) {
    nextAction = 'All services confirmed';
  }

  return {
    purpose: `Reservation request for ${order.customer.planeNumber}`,
    keyDetails: {
      services,
      passengers: order.passengers,
      aircraft: order.customer.planeNumber,
    },
    preferences: order.specialRequests || null,
    status: order.status,
    nextAction,
  };
}

export function ConversationSummary({ order, compact = false }: ConversationSummaryProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const summary = generateSummary(order);
  const transcript = generateMockTranscript(order);

  if (compact) {
    return (
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-3.5 h-3.5 text-info" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Request Summary
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {summary.purpose} • {summary.keyDetails.services.slice(0, 2).join(', ')}
          {summary.keyDetails.services.length > 2 && ` +${summary.keyDetails.services.length - 2} more`}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <ArrowRight className="w-3 h-3 text-info" />
          <span className="text-xs text-info font-medium">{summary.nextAction}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="aviation-panel p-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-info" />
          <h3 className="font-semibold text-foreground">Conversation Summary</h3>
        </div>

        <div className="space-y-4">
          {/* Purpose */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="w-3.5 h-3.5 text-muted-foreground" />
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Purpose</label>
            </div>
            <p className="text-sm text-foreground">{summary.purpose}</p>
          </div>

          {/* Key Details */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">
              Key Details Captured
            </label>
            <div className="flex flex-wrap gap-1.5">
              {summary.keyDetails.services.map((service, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs font-medium rounded-md bg-info/10 text-info border border-info/20"
                >
                  {service}
                </span>
              ))}
              <span className="px-2 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
                {summary.keyDetails.passengers} passengers
              </span>
            </div>
          </div>

          {/* Confirmed Preferences */}
          {summary.preferences && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                <label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Confirmed Preferences
                </label>
              </div>
              <p className="text-sm text-foreground bg-muted/50 rounded-md px-3 py-2">
                {summary.preferences}
              </p>
            </div>
          )}

          {/* Status & Next Action */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">
                  Current Status
                </label>
                <span className={cn(
                  "text-sm font-medium capitalize",
                  summary.status === 'completed' && "text-success",
                  summary.status === 'processing' && "text-info",
                  summary.status === 'failed' && "text-destructive",
                  summary.status === 'scheduled' && "text-warning"
                )}>
                  {summary.status}
                </span>
              </div>
              <div className="text-right">
                <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">
                  Next Action
                </label>
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-info" />
                  <span className="text-sm font-medium text-info">{summary.nextAction}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Show Transcript Button */}
          <div className="pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTranscript(true)}
              className="w-full gap-2"
            >
              <FileText className="w-4 h-4" />
              Show Transcript
            </Button>
          </div>
        </div>
      </div>

      {/* Transcript Dialog */}
      <Dialog open={showTranscript} onOpenChange={setShowTranscript}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-info" />
              Full Conversation Transcript
            </DialogTitle>
            <DialogDescription>
              Complete message history for order {order.id}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] pr-4">
            <div className="space-y-4">
              {transcript.map((message, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col gap-1",
                    message.role === 'pilot' ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-3",
                      message.role === 'pilot'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs text-muted-foreground capitalize">
                      {message.role === 'pilot' ? 'Pilot' : 'AI Agent'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

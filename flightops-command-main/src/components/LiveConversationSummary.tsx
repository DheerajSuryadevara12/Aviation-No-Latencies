import { useState } from 'react';
import { Order } from '@/types/aviation';
import { MessageSquare, Target, CheckCircle2, ArrowRight, FileText, AlertTriangle } from 'lucide-react';
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
import { getStoredConversationForOrder } from '@/data/conversationScripts';

interface Message {
  id: string;
  role: 'pilot' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  triggersAgents?: string[];
  isError?: boolean;
}

interface LiveConversationSummaryProps {
  order: Order;
  liveMessages: Message[];
  conversationComplete: boolean;
  hasFailed: boolean;
}

export function LiveConversationSummary({
  order,
  liveMessages,
  conversationComplete,
  hasFailed
}: LiveConversationSummaryProps) {
  const [showTranscript, setShowTranscript] = useState(false);

  // Use live messages if available, otherwise use stored conversation
  const hasLiveMessages = liveMessages.length > 0;
  const storedTranscript = getStoredConversationForOrder(order);

  // Convert live messages to transcript format
  const liveTranscript = liveMessages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'pilot' | 'agent',
      content: m.content,
      timestamp: m.timestamp,
    }));

  const transcript = hasLiveMessages ? liveTranscript : storedTranscript;

  // Null safety for live orders
  const agents = order.agents || [];

  // Generate summary
  const services = (order.items || []).map(item => {
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

  const completedCount = agents.filter(a => a.status === 'success').length;
  const failedCount = agents.filter(a => a.status === 'failed').length;
  const inProgressCount = agents.filter(a => a.status === 'in_progress').length;

  let nextAction = 'Awaiting processing';
  let currentStatus = order.status;

  if (conversationComplete) {
    if (hasFailed) {
      nextAction = 'Human agent assigned';
      currentStatus = 'failed';
    } else {
      nextAction = 'All services confirmed';
      currentStatus = 'completed';
    }
  } else if (failedCount > 0) {
    nextAction = 'Manual intervention required';
  } else if (inProgressCount > 0) {
    nextAction = 'Processing services';
  } else if (completedCount === agents.length && agents.length > 0) {
    nextAction = 'All services confirmed';
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
            <p className="text-sm text-foreground">Reservation request for {order.customer?.planeNumber || 'N/A'}</p>
          </div>

          {/* Key Details */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">
              Key Details Captured
            </label>
            <div className="flex flex-wrap gap-1.5">
              {services.map((service, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs font-medium rounded-md bg-info/10 text-info border border-info/20"
                >
                  {service}
                </span>
              ))}
              <span className="px-2 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
                {order.passengers} passengers
              </span>
            </div>
          </div>

          {/* Confirmed Preferences */}
          {order.specialRequests && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                <label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Confirmed Preferences
                </label>
              </div>
              <p className="text-sm text-foreground bg-muted/50 rounded-md px-3 py-2">
                {order.specialRequests}
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
                  currentStatus === 'completed' && "text-success",
                  currentStatus === 'processing' && "text-info",
                  currentStatus === 'failed' && "text-destructive",
                  currentStatus === 'scheduled' && "text-warning"
                )}>
                  {currentStatus}
                </span>
              </div>
              <div className="text-right">
                <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">
                  Next Action
                </label>
                <div className="flex items-center gap-1.5">
                  {hasFailed && conversationComplete ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-info" />
                  )}
                  <span className={cn(
                    "text-sm font-medium",
                    hasFailed && conversationComplete ? "text-warning" : "text-info"
                  )}>
                    {nextAction}
                  </span>
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
              disabled={transcript.length === 0}
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

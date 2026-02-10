import { ReservationRequest } from '@/types/aviation';
import { 
  Plane, 
  MapPin, 
  Clock, 
  Utensils, 
  Wine, 
  Fuel, 
  Sparkles, 
  Car,
  User,
  Calendar,
  Bot
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RequestSummaryPanelProps {
  reservation: ReservationRequest;
  highlightedServices: string[];
}

interface ParsedRequestItem {
  label: string;
  value: string;
  icon: React.ElementType;
  isAgentTriggered?: boolean;
  agentName?: string;
}

export function RequestSummaryPanel({ reservation, highlightedServices }: RequestSummaryPanelProps) {
  const coreDetails: ParsedRequestItem[] = [
    {
      label: 'Flight Number',
      value: reservation.flightNumber,
      icon: Plane,
    },
    {
      label: 'Airport',
      value: reservation.airport,
      icon: MapPin,
    },
    {
      label: 'Requested Time',
      value: format(reservation.requestedTime, 'MMM d, yyyy • h:mm a') + ' EST',
      icon: Clock,
    },
  ];

  if (reservation.customer) {
    coreDetails.push({
      label: 'Customer',
      value: reservation.customer.name,
      icon: User,
    });
  }

  const serviceItems: ParsedRequestItem[] = [
    {
      label: 'Catering',
      value: reservation.services.catering ? 'Requested' : 'Not requested',
      icon: Utensils,
      isAgentTriggered: reservation.services.catering,
      agentName: 'Services & Amenities Agent',
    },
    {
      label: 'Champagne',
      value: reservation.services.champagne ? 'Requested' : 'Not requested',
      icon: Wine,
      isAgentTriggered: reservation.services.champagne,
      agentName: 'Services & Amenities Agent',
    },
    {
      label: 'Refueling',
      value: reservation.services.refueling ? 'Requested' : 'Not requested',
      icon: Fuel,
      isAgentTriggered: reservation.services.refueling,
      agentName: 'Services & Amenities Agent',
    },
    {
      label: 'Dry Cleaning',
      value: reservation.services.dryCleanig ? 'Requested' : 'Not requested',
      icon: Sparkles,
      isAgentTriggered: reservation.services.dryCleanig,
      agentName: 'Services & Amenities Agent',
    },
    {
      label: 'Car Service',
      value: reservation.services.carService ? 'Requested' : 'Not requested',
      icon: Car,
      isAgentTriggered: reservation.services.carService,
      agentName: 'Services & Amenities Agent',
    },
  ];

  const activeServices = serviceItems.filter(s => s.isAgentTriggered);
  const hasActiveServices = activeServices.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Request Summary</h3>
        </div>
        <div className={cn(
          'px-2.5 py-1 rounded-full text-xs font-medium',
          reservation.status === 'incoming' && 'bg-warning/10 text-warning',
          reservation.status === 'processing' && 'bg-info/10 text-info',
          reservation.status === 'confirmed' && 'bg-success/10 text-success',
        )}>
          {reservation.status === 'incoming' && 'New Request'}
          {reservation.status === 'processing' && 'Processing'}
          {reservation.status === 'confirmed' && 'Confirmed'}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Core Flight Details */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Flight Details</p>
          <div className="space-y-2">
            {coreDetails.map((item) => (
              <div 
                key={item.label}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="p-2 rounded-md bg-primary/10">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="font-medium text-foreground truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Requested Services - Agent Triggered */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Requested Services</p>
            {hasActiveServices && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-info/10 text-info text-[10px] font-medium">
                <Bot className="w-3 h-3" />
                Agent Handled
              </div>
            )}
          </div>
          <div className="space-y-2">
            {serviceItems.map((item) => {
              const isHighlighted = highlightedServices.includes(item.label.toLowerCase());
              
              return (
                <div 
                  key={item.label}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-all duration-300',
                    item.isAgentTriggered 
                      ? 'bg-info/5 border-info/30' 
                      : 'bg-muted/30 border-border/50 opacity-50',
                    isHighlighted && 'ring-2 ring-info ring-offset-2 ring-offset-background'
                  )}
                >
                  <div className={cn(
                    'p-2 rounded-md',
                    item.isAgentTriggered ? 'bg-info/20' : 'bg-muted'
                  )}>
                    <item.icon className={cn(
                      'w-4 h-4',
                      item.isAgentTriggered ? 'text-info' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        'font-medium',
                        item.isAgentTriggered ? 'text-info' : 'text-muted-foreground'
                      )}>
                        {item.label}
                      </p>
                      {item.isAgentTriggered && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-info/10 text-[10px] text-info font-medium">
                          <Bot className="w-2.5 h-2.5" />
                          AI
                        </span>
                      )}
                    </div>
                    {item.isAgentTriggered && item.agentName && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Handled by {item.agentName}
                      </p>
                    )}
                  </div>
                  {item.isAgentTriggered && (
                    <div className="w-2 h-2 rounded-full bg-info animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Legend</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-info/20 border border-info/30" />
              <span className="text-muted-foreground">Agent Triggered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-muted border border-border/50" />
              <span className="text-muted-foreground">Not Requested</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

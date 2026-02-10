import { ReservationAgentExecution } from '@/types/aviation';
import { cn } from '@/lib/utils';
import { 
  Plane, 
  UserSearch, 
  Sparkles, 
  Cloud, 
  Users,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';

interface AgentActivityCardProps {
  agent: ReservationAgentExecution;
}

const agentIcons: Record<ReservationAgentExecution['agentType'], React.ElementType> = {
  ramp_availability: Plane,
  customer_lookup: UserSearch,
  services_amenities: Sparkles,
  weather_checker: Cloud,
  workforce: Users,
};

const agentDisplayNames: Record<ReservationAgentExecution['agentType'], string> = {
  ramp_availability: 'Airport Ramp Availability Agent',
  customer_lookup: 'Customer Lookup Agent',
  services_amenities: 'Services & Amenities Agent',
  weather_checker: 'Weather Analysis Agent',
  workforce: 'Workforce Scheduling Agent',
};

export function AgentActivityCard({ agent }: AgentActivityCardProps) {
  const Icon = agentIcons[agent.agentType];
  const displayName = agentDisplayNames[agent.agentType];
  const isActive = agent.status === 'in_progress';
  const isSuccess = agent.status === 'success';
  const isFailed = agent.status === 'failed';
  const isPending = agent.status === 'pending';

  return (
    <div
      className={cn(
        'relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-300',
        'bg-accent/30 backdrop-blur-sm',
        isActive && 'border-info/50 bg-info/10 shadow-lg',
        isSuccess && 'border-success/50 bg-success/10',
        isFailed && 'border-destructive/50 bg-destructive/10',
        isPending && 'border-border/50 opacity-60'
      )}
    >
      {/* Animated Icon Container */}
      <div
        className={cn(
          'relative flex items-center justify-center w-10 h-10 rounded-lg',
          isActive && 'bg-info/20',
          isSuccess && 'bg-success/20',
          isFailed && 'bg-destructive/20',
          isPending && 'bg-muted'
        )}
      >
        {isActive ? (
          <div className="relative">
            {/* Animated bars for processing state */}
            <div className="flex items-end gap-0.5 h-5">
              <div className="w-1 bg-info rounded-full animate-pulse" style={{ height: '60%', animationDelay: '0ms' }} />
              <div className="w-1 bg-info rounded-full animate-pulse" style={{ height: '100%', animationDelay: '150ms' }} />
              <div className="w-1 bg-info rounded-full animate-pulse" style={{ height: '40%', animationDelay: '300ms' }} />
              <div className="w-1 bg-info rounded-full animate-pulse" style={{ height: '80%', animationDelay: '450ms' }} />
            </div>
          </div>
        ) : isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-success" />
        ) : isFailed ? (
          <XCircle className="w-5 h-5 text-destructive" />
        ) : (
          <Icon className="w-5 h-5 text-muted-foreground" />
        )}
      </div>

      {/* Agent Info */}
      <div className="flex-1 min-w-0">
        <h4 className={cn(
          'font-medium text-sm truncate',
          isActive && 'text-info',
          isSuccess && 'text-success',
          isFailed && 'text-destructive',
          isPending && 'text-muted-foreground'
        )}>
          {displayName}
        </h4>
        <p className={cn(
          'text-xs truncate',
          isActive ? 'text-info/80' : 'text-muted-foreground'
        )}>
          {agent.currentAction}
        </p>
      </div>

      {/* Status Indicator */}
      {isActive && (
        <Loader2 className="w-4 h-4 text-info animate-spin flex-shrink-0" />
      )}

      {/* Active glow effect */}
      {isActive && (
        <div className="absolute inset-0 rounded-xl bg-info/5 animate-pulse pointer-events-none" />
      )}
    </div>
  );
}

import { AgentExecution } from '@/types/aviation';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle, Loader2, Fuel, UtensilsCrossed, Wine, Car } from 'lucide-react';

interface AgentExecutionCardProps {
  agent: AgentExecution;
}

const agentIcons: Record<AgentExecution['agentType'], React.ElementType> = {
  refueling: Fuel,
  catering: UtensilsCrossed,
  wine: Wine,
  car_rental: Car,
};

const statusLabels: Record<AgentExecution['status'], string> = {
  pending: 'Waiting...',
  in_progress: 'Processing...',
  success: 'Complete',
  failed: 'Failed',
};

export function AgentExecutionCard({ agent }: AgentExecutionCardProps) {
  const Icon = agentIcons[agent.agentType];
  const currentStep = agent.steps.find(s => s.status === 'in_progress');

  return (
    <div
      className={cn(
        'agent-card animate-fade-in',
        agent.status === 'in_progress' && 'agent-card-active',
        agent.status === 'success' && 'agent-card-success',
        agent.status === 'failed' && 'agent-card-failed'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-lg',
              agent.status === 'success' && 'bg-success/10 text-success',
              agent.status === 'in_progress' && 'bg-info/10 text-info',
              agent.status === 'pending' && 'bg-muted text-muted-foreground',
              agent.status === 'failed' && 'bg-destructive/10 text-destructive'
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{agent.agentName}</h4>
            <p className="text-xs text-muted-foreground">
              Status:{' '}
              <span
                className={cn(
                  'font-medium',
                  agent.status === 'success' && 'text-success',
                  agent.status === 'in_progress' && 'text-info',
                  agent.status === 'failed' && 'text-destructive'
                )}
              >
                {currentStep ? currentStep.label + '...' : statusLabels[agent.status]}
              </span>
            </p>
          </div>
        </div>
        {agent.status === 'in_progress' && (
          <Loader2 className="w-5 h-5 text-info animate-spin" />
        )}
        {agent.status === 'success' && (
          <CheckCircle2 className="w-5 h-5 text-success" />
        )}
        {agent.status === 'failed' && (
          <XCircle className="w-5 h-5 text-destructive" />
        )}
      </div>

      {/* Progress Steps */}
      <div className="space-y-2 mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Progress</p>
        {agent.steps.map((step) => (
          <div key={step.id} className="flex items-center gap-2 text-sm">
            {step.status === 'completed' && (
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
            )}
            {step.status === 'in_progress' && (
              <Loader2 className="w-4 h-4 text-info animate-spin flex-shrink-0" />
            )}
            {step.status === 'pending' && (
              <Clock className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
            )}
            {step.status === 'failed' && (
              <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            )}
            <span
              className={cn(
                step.status === 'completed' && 'text-foreground',
                step.status === 'in_progress' && 'text-info font-medium',
                step.status === 'pending' && 'text-muted-foreground/60',
                step.status === 'failed' && 'text-destructive'
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Result */}
      {agent.status === 'success' && agent.result && (
        <div className="pt-3 border-t border-border space-y-2">
          {agent.result.vendor && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vendor</span>
              <span className="font-medium text-foreground">{agent.result.vendor}</span>
            </div>
          )}
          {agent.result.price && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price</span>
              <span className="font-semibold text-success">{agent.result.price}</span>
            </div>
          )}
          {agent.result.pickupTime && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pickup</span>
              <span className="text-foreground">{agent.result.pickupTime}</span>
            </div>
          )}
          {agent.result.location && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Location</span>
              <span className="text-foreground">{agent.result.location}</span>
            </div>
          )}
          {agent.result.details && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Details</span>
              <span className="text-foreground">{agent.result.details}</span>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {agent.status === 'failed' && agent.errorMessage && (
        <div className="pt-3 border-t border-destructive/20">
          <p className="text-sm text-destructive">{agent.errorMessage}</p>
          {agent.retryCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Retry attempts: {agent.retryCount}/3
            </p>
          )}
        </div>
      )}
    </div>
  );
}

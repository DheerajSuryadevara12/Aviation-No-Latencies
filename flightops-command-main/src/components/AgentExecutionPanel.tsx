import { Order } from '@/types/aviation';
import { AgentExecutionCard } from './AgentExecutionCard';
import { Button } from '@/components/ui/button';
import { Bot, RefreshCw, Edit, XCircle, AlertTriangle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentExecutionPanelProps {
  order: Order;
  onRetryAgent?: (agentId: string) => void;
  onEditOrder?: () => void;
  onCancelOrder?: () => void;
  onInvestigate?: (agentId: string) => void;
}

export function AgentExecutionPanel({
  order,
  onRetryAgent,
  onEditOrder,
  onCancelOrder,
  onInvestigate,
}: AgentExecutionPanelProps) {
  const failedAgents = order.agents.filter(a => a.status === 'failed');
  const hasFailure = failedAgents.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="aviation-panel p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Live Agent Execution</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                order.status === 'processing' && 'bg-info animate-pulse-soft',
                order.status === 'completed' && 'bg-success',
                order.status === 'scheduled' && 'bg-muted-foreground'
              )}
            />
            {order.status === 'processing' ? 'Live' : order.status}
          </div>
        </div>
      </div>

      {/* Failed Alert Banner */}
      {hasFailure && (
        <div className="alert-banner-critical rounded-lg p-4 border animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">
                ⚠️ {failedAgents.map(a => a.agentName).join(', ')} Failed
              </p>
              <p className="text-sm mt-1 opacity-90">
                Manual intervention required. Click investigate to review the issue.
              </p>
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="flex-shrink-0"
              onClick={() => onInvestigate?.(failedAgents[0].id)}
            >
              <Search className="w-4 h-4 mr-1" />
              Investigate
            </Button>
          </div>
        </div>
      )}

      {/* Agent Cards */}
      <div className="space-y-3">
        {order.agents.map((agent) => (
          <AgentExecutionCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Manual Controls */}
      <div className="aviation-panel p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
          Manual Controls
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEditOrder}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit Order
          </Button>
          {hasFailure && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetryAgent?.(failedAgents[0].id)}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry Failed
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onCancelOrder}
            className="flex-1 text-destructive hover:text-destructive"
          >
            <XCircle className="w-4 h-4 mr-1" />
            Cancel Order
          </Button>
        </div>
      </div>
    </div>
  );
}

import { ReservationAgentExecution } from '@/types/aviation';
import { AgentActivityCard } from './AgentActivityCard';
import { Bot, Zap } from 'lucide-react';

interface AgentActivityPanelProps {
  agents: ReservationAgentExecution[];
  isProcessing: boolean;
}

export function AgentActivityPanel({ agents, isProcessing }: AgentActivityPanelProps) {
  const activeCount = agents.filter(a => a.status === 'in_progress').length;
  const completedCount = agents.filter(a => a.status === 'success').length;
  const totalCount = agents.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="w-5 h-5 text-primary" />
            {isProcessing && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-info rounded-full animate-pulse" />
            )}
          </div>
          <h3 className="font-semibold text-foreground">AI Agents Activity</h3>
        </div>
        {isProcessing && (
          <div className="flex items-center gap-1.5 text-xs text-info">
            <Zap className="w-3 h-3" />
            <span>Processing in parallel</span>
          </div>
        )}
      </div>

      {/* Progress Summary */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">
            <span className="text-success">{completedCount}</span>
            <span className="text-muted-foreground"> / {totalCount} agents</span>
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-info to-success transition-all duration-500 ease-out"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Agent Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {agents.map((agent) => (
          <AgentActivityCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Footer with active status */}
      {isProcessing && activeCount > 0 && (
        <div className="p-4 border-t border-border bg-info/5">
          <p className="text-xs text-info text-center">
            {activeCount} agent{activeCount > 1 ? 's' : ''} currently processing...
          </p>
        </div>
      )}
    </div>
  );
}

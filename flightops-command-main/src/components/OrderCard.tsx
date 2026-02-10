import { Order } from '@/types/aviation';
import { StatusBadge } from './StatusBadge';
import { Plane, Users, Clock, ChevronRight, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface OrderCardProps {
  order: Order;
  onClick: (order: Order) => void;
}

export function OrderCard({ order, onClick }: OrderCardProps) {
  // Null safety for live orders that may not have agents array
  const agents = order.agents || [];
  const hasFailedAgent = agents.some(a => a.status === 'failed');
  const activeAgents = agents.filter(a => a.status === 'in_progress').length;
  const completedAgents = agents.filter(a => a.status === 'success').length;

  return (
    <div
      onClick={() => onClick(order)}
      className={cn(
        'aviation-panel p-5 cursor-pointer order-card-hover animate-fade-in group scan-line',
        hasFailedAgent && 'border-destructive/25 bg-gradient-to-br from-destructive/5 to-transparent',
        activeAgents > 0 && !hasFailedAgent && 'active-glow'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground text-lg tracking-tight group-hover:text-accent transition-colors">
            {order.customer.name}
          </h3>
          <p className="text-xs text-muted-foreground font-mono mt-0.5 tracking-wider">{order.id}</p>
        </div>
        <StatusBadge status={order.status} size="sm" />
      </div>

      {/* Staff Assignment - Futuristic */}
      {order.assignedStaff && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20">
          <div className="w-7 h-7 rounded-md bg-accent/15 flex items-center justify-center">
            <UserCheck className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{order.assignedStaff.name}</p>
            <p className="text-[10px] text-muted-foreground font-mono tracking-wider">{order.assignedStaff.id}</p>
          </div>
        </div>
      )}

      {/* Details - Refined */}
      <div className="space-y-2.5 mb-4">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-md bg-muted/60 flex items-center justify-center border border-border/50">
            <Plane className="w-4 h-4 text-accent" />
          </div>
          <div>
            <span className="font-mono text-foreground font-medium tracking-wide">{order.customer.planeNumber}</span>
            <span className="text-muted-foreground mx-2">•</span>
            <span className="text-muted-foreground">{order.customer.pilotName}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-md bg-muted/60 flex items-center justify-center border border-border/50">
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-muted-foreground font-mono text-xs tracking-wide">{format(order.arrivalTime, 'MMM d, yyyy • HH:mm')}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-md bg-muted/60 flex items-center justify-center border border-border/50">
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-muted-foreground">{order.passengers} passengers</span>
        </div>
      </div>

      {/* Agent Status Summary - Futuristic */}
      <div className="flex items-center gap-3 pt-4 border-t border-border/50">
        <div className="flex -space-x-1.5">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={cn(
                'w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium border-2 border-card shadow-sm transition-all duration-200 hover:scale-110 hover:z-10',
                agent.status === 'success' && 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_0_8px_hsl(160_65%_42%/0.4)]',
                agent.status === 'in_progress' && 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-[0_0_8px_hsl(185_70%_50%/0.4)]',
                agent.status === 'pending' && 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500',
                agent.status === 'failed' && 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-[0_0_8px_hsl(0_70%_50%/0.4)]'
              )}
              title={agent.agentName}
            >
              {agent.status === 'success' ? '✓' :
                agent.status === 'failed' ? '✕' :
                  agent.status === 'in_progress' ? '◉' : '○'}
            </div>
          ))}
        </div>
        <span className="text-xs text-muted-foreground flex-1 font-mono">
          <span className="font-semibold text-foreground">{completedAgents}</span>/{agents.length} complete
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
      </div>

      {/* Failed Alert - Futuristic */}
      {hasFailedAgent && (
        <div className="mt-4 px-4 py-2.5 rounded-lg bg-gradient-to-r from-destructive/10 to-destructive/5 border border-destructive/25">
          <p className="text-xs text-destructive font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse shadow-[0_0_6px_hsl(0_70%_50%/0.6)]" />
            Agent failure – Manual intervention required
          </p>
        </div>
      )}
    </div>
  );
}

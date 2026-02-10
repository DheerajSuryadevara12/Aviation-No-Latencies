import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle, Loader2, Calendar } from 'lucide-react';

type Status = 'pending' | 'in_progress' | 'completed' | 'success' | 'failed' | 'scheduled' | 'processing' | 'cancelled';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const statusConfig: Record<Status, { icon: React.ElementType; label: string; className: string; iconClass?: string }> = {
  pending: {
    icon: Clock,
    label: 'Pending',
    className: 'bg-slate-100/80 text-slate-600 border-slate-200/60 backdrop-blur-sm',
  },
  in_progress: {
    icon: Loader2,
    label: 'In Progress',
    className: 'bg-gradient-to-r from-cyan-50 to-cyan-100/80 text-cyan-700 border-cyan-300/50 shadow-[0_0_8px_hsl(185_70%_50%/0.15)]',
    iconClass: 'text-cyan-500',
  },
  processing: {
    icon: Loader2,
    label: 'Processing',
    className: 'bg-gradient-to-r from-cyan-50 to-cyan-100/80 text-cyan-700 border-cyan-300/50 shadow-[0_0_8px_hsl(185_70%_50%/0.15)]',
    iconClass: 'text-cyan-500',
  },
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    className: 'bg-gradient-to-r from-emerald-50 to-green-100/80 text-emerald-700 border-emerald-300/50 shadow-[0_0_8px_hsl(160_65%_42%/0.15)]',
    iconClass: 'text-emerald-500',
  },
  success: {
    icon: CheckCircle2,
    label: 'Success',
    className: 'bg-gradient-to-r from-emerald-50 to-green-100/80 text-emerald-700 border-emerald-300/50 shadow-[0_0_8px_hsl(160_65%_42%/0.15)]',
    iconClass: 'text-emerald-500',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    className: 'bg-gradient-to-r from-red-50 to-rose-100/80 text-red-700 border-red-300/50 shadow-[0_0_8px_hsl(0_70%_50%/0.15)]',
    iconClass: 'text-red-500',
  },
  scheduled: {
    icon: Calendar,
    label: 'Scheduled',
    className: 'bg-gradient-to-r from-blue-50 to-indigo-100/80 text-blue-700 border-blue-300/50 shadow-[0_0_8px_hsl(220_70%_50%/0.15)]',
    iconClass: 'text-blue-500',
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    className: 'bg-slate-100/80 text-slate-500 border-slate-200/60',
  },
};

const sizeConfig = {
  sm: { badge: 'px-2.5 py-1 text-xs gap-1.5', icon: 'w-3 h-3' },
  md: { badge: 'px-3 py-1.5 text-xs gap-2', icon: 'w-3.5 h-3.5' },
  lg: { badge: 'px-4 py-2 text-sm gap-2', icon: 'w-4 h-4' },
};

export function StatusBadge({ status, size = 'md', showLabel = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;
  const isAnimated = status === 'in_progress' || status === 'processing';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border shadow-sm',
        config.className,
        sizeStyles.badge
      )}
    >
      <Icon className={cn(sizeStyles.icon, config.iconClass, isAnimated && 'animate-spin')} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

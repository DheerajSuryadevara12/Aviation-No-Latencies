import { Order, OrderCategory } from '@/types/aviation';
import { OrderCard } from './OrderCard';
import { cn } from '@/lib/utils';
import { History, Zap, Calendar } from 'lucide-react';

interface OrderColumnProps {
  category: OrderCategory;
  orders: Order[];
  onOrderClick: (order: Order) => void;
}

const categoryConfig = {
  past: {
    title: 'Past Orders',
    subtitle: 'Completed flights',
    icon: History,
    emptyMessage: 'No past orders',
    accentColor: 'from-slate-400 to-slate-500',
    iconBg: 'bg-slate-100/80 text-slate-500 border border-slate-200/50',
    countBg: 'bg-slate-100 text-slate-600 border border-slate-200/50',
  },
  active: {
    title: 'Active Orders',
    subtitle: 'Currently processing',
    icon: Zap,
    emptyMessage: 'No active orders',
    accentColor: 'from-cyan-400 to-cyan-600',
    iconBg: 'bg-cyan-50/80 text-cyan-600 border border-cyan-200/50',
    countBg: 'bg-cyan-100 text-cyan-700 border border-cyan-200/50',
  },
  future: {
    title: 'Future Orders',
    subtitle: 'Scheduled flights',
    icon: Calendar,
    emptyMessage: 'No scheduled orders',
    accentColor: 'from-blue-400 to-indigo-500',
    iconBg: 'bg-blue-50/80 text-blue-600 border border-blue-200/50',
    countBg: 'bg-blue-100 text-blue-700 border border-blue-200/50',
  },
};

export function OrderColumn({ category, orders, onOrderClick }: OrderColumnProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <div className="flex flex-col h-full">
      {/* Column Header - Futuristic */}
      <div className="pb-5 mb-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg',
            config.iconBg
          )}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-lg text-foreground tracking-wide">{config.title}</h2>
              <span className={cn(
                'px-2.5 py-0.5 text-xs font-semibold rounded-md font-mono',
                config.countBg
              )}>
                {orders.length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground tracking-wide">{config.subtitle}</p>
          </div>
        </div>
        {/* Accent line */}
        <div className={cn(
          'h-px rounded-full bg-gradient-to-r opacity-80',
          config.accentColor
        )} />
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <Icon className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm">{config.emptyMessage}</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard key={order.id} order={order} onClick={onOrderClick} />
          ))
        )}
      </div>
    </div>
  );
}

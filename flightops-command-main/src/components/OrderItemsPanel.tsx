import { Order, OrderItem } from '@/types/aviation';
import { StatusBadge } from './StatusBadge';
import { Fuel, UtensilsCrossed, Wine, Car, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderItemsPanelProps {
  order: Order;
}

const itemTypeConfig: Record<OrderItem['type'], { icon: React.ElementType; label: string; color: string }> = {
  refueling: { icon: Fuel, label: 'Refueling', color: 'text-amber-500' },
  catering: { icon: UtensilsCrossed, label: 'Catering', color: 'text-emerald-500' },
  wine: { icon: Wine, label: 'Wine', color: 'text-rose-500' },
  car_rental: { icon: Car, label: 'Car Rental', color: 'text-blue-500' },
  special_request: { icon: Sparkles, label: 'Special Request', color: 'text-purple-500' },
  dry_cleaning: { icon: Sparkles, label: 'Dry Cleaning', color: 'text-cyan-500' },
};

export function OrderItemsPanel({ order }: OrderItemsPanelProps) {
  return (
    <div className="aviation-panel p-5">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center text-primary text-xs">
          {order.items.length}
        </span>
        Order Items
      </h3>

      <div className="space-y-3">
        {order.items.map((item) => {
          const config = itemTypeConfig[item.type];
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className={cn(
                'p-4 rounded-lg border border-border bg-muted/30',
                item.status === 'completed' && 'bg-success/5 border-success/20',
                item.status === 'failed' && 'bg-destructive/5 border-destructive/20'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn('p-1.5 rounded-md bg-card', config.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-foreground">{config.label}</span>
                </div>
                <StatusBadge status={item.status} size="sm" />
              </div>
              <p className="text-sm text-muted-foreground pl-9">{item.description}</p>
            </div>
          );
        })}
      </div>

      {/* Order Summary */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Items</span>
          <span className="font-medium text-foreground">{order.items.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-muted-foreground">Completed</span>
          <span className="font-medium text-success">
            {order.items.filter(i => i.status === 'completed').length}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-muted-foreground">In Progress</span>
          <span className="font-medium text-info">
            {order.items.filter(i => i.status === 'in_progress').length}
          </span>
        </div>
      </div>
    </div>
  );
}

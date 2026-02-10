import { Order } from '@/types/aviation';
import { User, Phone, Plane, Users, Clock, FileText, UserCheck } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerInfoPanelProps {
  order: Order;
}

export function CustomerInfoPanel({ order }: CustomerInfoPanelProps) {
  // Null safety for live orders
  const customer = order.customer || {} as Partial<Order['customer']>;
  const assignedStaff = order.assignedStaff;

  return (
    <div className="aviation-panel p-5">
      {/* Assigned Staff - Top Right */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Customer Information
        </h3>
        {assignedStaff && (
          <div className="flex items-center gap-1.5 text-xs bg-primary/10 px-2.5 py-1.5 rounded-md border border-primary/20">
            <UserCheck className="w-3.5 h-3.5 text-primary" />
            <div className="flex flex-col items-end">
              <span className="font-medium text-foreground">{assignedStaff.name}</span>
              <span className="font-mono text-primary text-[10px]">{assignedStaff.id}</span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Name</label>
          <p className="font-medium text-foreground mt-1">{customer.name || 'Identifying...'}</p>
        </div>

        {customer.phone && (
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Phone</label>
            <div className="flex items-center gap-2 mt-1">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-foreground">{customer.phone}</span>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Pilot</label>
          <p className="font-medium text-foreground mt-1">{customer.pilotName || 'Unknown'}</p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Aircraft</label>
          <div className="flex items-center gap-2 mt-1">
            <Plane className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono font-medium text-foreground">{customer.planeNumber || 'N/A'}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Passengers</label>
          <div className="flex items-center gap-2 mt-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">{order.passengers || 0} passengers</span>
          </div>
        </div>

        {order.arrivalTime && (
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Arrival Time</label>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{format(new Date(order.arrivalTime), 'MMM d, yyyy')}</span>
            </div>
            <p className="text-lg font-semibold text-foreground mt-1">
              {format(new Date(order.arrivalTime), 'h:mm a')}
            </p>
          </div>
        )}

        {order.specialRequests && (
          <div className="pt-4 border-t border-border">
            <label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Special Requests
            </label>
            <p className="text-sm text-foreground mt-2 p-3 bg-muted/50 rounded-md">
              {order.specialRequests}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

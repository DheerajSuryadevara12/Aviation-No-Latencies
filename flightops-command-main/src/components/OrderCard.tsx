import { Order } from '@/types/aviation';
import { Plane, Users, Clock, ChevronRight, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface OrderCardProps {
  order: Order;
  onClick: (order: Order) => void;
}

export function OrderCard({ order, onClick }: OrderCardProps) {
  const agents = order.agents || [];
  const completedAgents = agents.filter(a => a.status === 'success').length;

  const getBorderColorClass = () => {
    switch (order.status) {
      case 'completed': return 'border-l-[#16a15e]';
      case 'processing': return 'border-l-[#e01818]';
      case 'scheduled':
      case 'pending':
      default: return 'border-l-[#7056f0]';
    }
  };

  const getStatusText = () => {
    switch (order.status) {
      case 'completed': return 'Completed';
      case 'processing': return 'Active';
      default: return 'Scheduled';
    }
  };

  return (
    <div
      onClick={() => onClick(order)}
      className={cn(
        "bg-[#ffffff] rounded-[13px] p-[16px] mb-[12px] border border-[#e4e6f0] border-l-[3px] cursor-pointer group",
        "shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-200",
        "hover:shadow-[0_8px_24px_rgba(0,0,0,0.09)] hover:-translate-y-[2px] hover:border-l-[#e01818]",
        getBorderColorClass()
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-2">
          <h3 className="font-['Outfit'] font-[700] text-[15px] text-[#141420] tracking-[-0.2px] leading-tight truncate group-hover:text-[#e01818] transition-colors">
            {order.customer.name}
          </h3>
          <p className="font-['DM_Mono'] font-[400] text-[10px] text-[#b0b0c4] mt-[2px] uppercase">
            {order.id}
          </p>
        </div>
        <div className={cn(
          "font-['DM_Sans'] text-[10.5px] font-[600] px-[10px] py-[3px] rounded-[20px] flex items-center gap-[5px] shrink-0",
          order.status === 'completed' ? 'bg-[#eaf8f0] text-[#16a15e] border border-[#c0ead4]' :
          order.status === 'processing' ? 'bg-[#fff0f0] text-[#e01818] border border-[#ffd0d0]' :
          'bg-[#f0eeff] text-[#7056f0] border border-[#d8d0ff]'
        )}>
          {getStatusText()}
        </div>
      </div>

      {/* Staff Assignment */}
      {order.assignedStaff && (
        <div className="bg-[#f7f8fc] border border-[#eaecf5] rounded-[8px] p-[8px_12px] flex items-center gap-[9px] mb-[11px]">
          <div className="w-[26px] h-[26px] rounded-[6px] bg-gradient-to-br from-[#c0c8e8] to-[#9098c0] flex items-center justify-center">
            <UserCheck className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-['DM_Sans'] text-[12.5px] font-[600] text-[#141420] truncate">
              {order.assignedStaff.name}
            </p>
            <p className="font-['DM_Mono'] text-[9.5px] text-[#b0b0c4] uppercase">
              {order.assignedStaff.id}
            </p>
          </div>
        </div>
      )}

      {/* Details Stack */}
      <div className="flex flex-col gap-[6px] mb-4">
        <div className="flex items-center gap-[8px] text-[12px] text-[#6a6a80] font-['DM_Sans']">
          <Plane className="w-[14px] h-[14px] text-[#b0b0c4]" />
          <span>
            <span className="font-['DM_Mono'] font-medium">{order.customer.planeNumber}</span>
            <span className="mx-1">•</span>
            {order.customer.pilotName}
          </span>
        </div>
        <div className="flex items-center gap-[8px] text-[12px] text-[#6a6a80] font-['DM_Sans']">
          <Clock className="w-[14px] h-[14px] text-[#b0b0c4]" />
          <span className="font-['DM_Mono'] text-[11px]">{format(order.arrivalTime, 'MMM d, yyyy • HH:mm')}</span>
        </div>
        <div className="flex items-center gap-[8px] text-[12px] text-[#6a6a80] font-['DM_Sans']">
          <Users className="w-[14px] h-[14px] text-[#b0b0c4]" />
          <span>{order.passengers} passengers</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-[10px] border-t border-[#f6f7f9]">
        <div className="flex items-center gap-2">
          {order.status === 'completed' ? (
            <div className="w-[22px] h-[22px] rounded-[5px] bg-[#16a15e] flex items-center justify-center">
              <span className="text-white text-[12px] font-bold leading-none">✓</span>
            </div>
          ) : (
            <div className="w-[22px] h-[22px] rounded-[5px] bg-[#f0f0f8] border border-[#e4e6f0] flex items-center justify-center" />
          )}
          <span className="font-['DM_Mono'] text-[11px] text-[#b0b0c4]">
            {completedAgents}/{agents.length} complete
          </span>
        </div>
        <div className="w-[26px] h-[26px] bg-[#f6f7f9] border border-[#e4e6f0] rounded-[6px] text-[#b0b0c4] flex items-center justify-center transition-all duration-150 group-hover:bg-[#e01818] group-hover:border-[#e01818] group-hover:text-white group-hover:shadow-[0_2px_10px_rgba(224,24,24,0.22)]">
          <ChevronRight className="w-4 h-4 ml-[1px]" />
        </div>
      </div>
    </div>
  );
}

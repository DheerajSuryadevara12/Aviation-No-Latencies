import { Order, OrderCategory } from '@/types/aviation';
import { OrderCard } from './OrderCard';
import { cn } from '@/lib/utils';
import { History, Zap, Calendar } from 'lucide-react';

interface OrderColumnProps {
  category: OrderCategory;
  orders: Order[];
  onOrderClick: (order: Order) => void;
  delay?: string;
}

const categoryConfig = {
  past: {
    title: 'Past Reservations',
    subtitle: 'Completed flights',
    icon: History,
    emptyMessage: 'No past reservations',
    accentColor: 'from-slate-400 to-slate-500',
    iconBg: 'bg-slate-100/80 text-slate-500 border border-slate-200/50',
    countBg: 'bg-slate-100 text-slate-600 border border-slate-200/50',
  },
  active: {
    title: 'Active Reservations',
    subtitle: 'Currently processing',
    icon: Zap,
    emptyMessage: 'No active reservations',
    accentColor: 'from-cyan-400 to-cyan-600',
    iconBg: 'bg-cyan-50/80 text-cyan-600 border border-cyan-200/50',
    countBg: 'bg-cyan-100 text-cyan-700 border border-cyan-200/50',
  },
  future: {
    title: 'Future Reservations',
    subtitle: 'Scheduled flights',
    icon: Calendar,
    emptyMessage: 'No scheduled reservations',
    accentColor: 'from-blue-400 to-indigo-500',
    iconBg: 'bg-blue-50/80 text-blue-600 border border-blue-200/50',
    countBg: 'bg-blue-100 text-blue-700 border border-blue-200/50',
  },
};

export function OrderColumn({ category, orders, onOrderClick, delay }: OrderColumnProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <div className={cn("flex flex-col h-full fade-up")} style={{ animationDelay: delay }}>
      {/* Column Header */}
      <div className="border-b border-[#e4e6f0] pb-[10px] mb-5">
        <div className="flex items-center gap-3">
          <h2 className="font-['DM_Sans'] font-[700] text-[11px] text-[#1a1a24] uppercase tracking-[1.5px]">
            {config.title}
          </h2>
          <span className="font-['DM_Mono'] text-[#1a1a24] border border-[#c8cad8] rounded-[20px] px-[8px] py-[2px] text-xs leading-none">
            {orders.length}
          </span>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4 pt-1">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-[48px_20px] bg-[#ffffff] rounded-[13px] border-[1.5px] border-dashed border-[#e4e6f0] gap-[14px] text-center transition-colors duration-200 hover:border-[#e01818] group">
            <div className="relative flex items-center justify-center w-16 h-16">
              <div className="absolute inset-0 border-2 border-[#e01818] rounded-full animate-[ring-pulse_1.5s_ease-out_infinite]" />
              <Icon className="w-8 h-8 text-[#b0b0c4] animate-[float_3s_ease-in-out_infinite]" />
            </div>
            <div>
              <h3 className="font-['Outfit'] font-[700] text-[14px] text-[#141420]">{config.emptyMessage}</h3>
              <p className="font-['DM_Sans'] text-[12px] text-[#b0b0c4] leading-[1.5] mt-1">Pending fleet assignment.</p>
            </div>
            <button className="bg-[rgba(224,24,24,0.07)] border border-[rgba(224,24,24,0.18)] text-[#e01818] font-['DM_Sans'] rounded-[6px] px-[14px] py-[7px] text-[13px] font-[600] hover:bg-[rgba(224,24,24,0.12)] transition-colors mt-2">
              View Records
            </button>
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

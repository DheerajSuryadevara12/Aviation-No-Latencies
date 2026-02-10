import { Order } from '@/types/aviation';
import { CustomerInfoPanel } from './CustomerInfoPanel';
import { ConversationSummary } from './ConversationSummary';
import { OrderItemsPanel } from './OrderItemsPanel';
import { AgentExecutionPanel } from './AgentExecutionPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface OrderDetailViewProps {
  order: Order;
  onBack: () => void;
}

export function OrderDetailView({ order, onBack }: OrderDetailViewProps) {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{order.customer.name}</h1>
              <StatusBadge status={order.status} size="lg" />
            </div>
            <p className="text-muted-foreground mt-1">
              Order <span className="font-mono">{order.id}</span> • {order.customer.planeNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel - Customer Info + Conversation Summary */}
        <div className="lg:col-span-3 space-y-4">
          <CustomerInfoPanel order={order} />
          <ConversationSummary order={order} />
        </div>

        {/* Center Panel - Order Items */}
        <div className="lg:col-span-4">
          <OrderItemsPanel order={order} />
        </div>

        {/* Right Panel - Agent Execution */}
        <div className="lg:col-span-5">
          <AgentExecutionPanel
            order={order}
            onRetryAgent={(id) => console.log('Retry agent:', id)}
            onEditOrder={() => console.log('Edit order')}
            onCancelOrder={() => console.log('Cancel order')}
            onInvestigate={(id) => console.log('Investigate:', id)}
          />
        </div>
      </div>
    </div>
  );
}

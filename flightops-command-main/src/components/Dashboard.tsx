import { useState, useEffect } from 'react';
import { Order } from '@/types/aviation';
import { getOrdersByCategory } from '@/data/mockData';
import { OrderColumn } from './OrderColumn';
import { LiveOrderDetailView } from './LiveOrderDetailView';

const API_URL = 'http://localhost:3001/api/orders';
const WS_URL = 'ws://localhost:3001';

export function Dashboard() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const ordersByCategory = getOrdersByCategory();

  // Helper to parse dates from JSON
  const parseOrderDates = (order: any): Order => ({
    ...order,
    arrivalTime: new Date(order.arrivalTime),
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
    // Parse deep nested dates if necessary, but these are top-level in Order type
    // Agents/items might have timestamps but those are usually generated or not strictly Dates in the minimal mock
  });

  // Fetch initial live orders
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLiveOrders(data.map(parseOrderDates));
        }
      })
      .catch(err => console.error('Failed to fetch orders:', err));

    // Listen for new live orders via WS
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_ORDER' || data.type === 'ORDER_UPDATE') {
          console.log(`WS: Received ${data.type}`, data.order);
          setLiveOrders(prev => {
            if (prev.find(o => o.id === data.order.id)) {
              console.log('Order already exists, updating', data.order.id);
              return prev.map(o => o.id === data.order.id ? parseOrderDates(data.order) : o);
            }
            if (data.type === 'NEW_ORDER') {
              console.log('Adding NEW order', data.order.id);
              return [...prev, parseOrderDates(data.order)];
            }
            return prev;
          });
        }
      } catch (e) {
        console.error('WS Parse Error', e);
      }
    };

    return () => ws.close();
  }, []);

  // Sync selectedOrder with updates from liveOrders (e.g. when order is marked completed)
  useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = liveOrders.find(o => o.id === selectedOrder.id);
      if (updatedOrder && updatedOrder !== selectedOrder) {
        setSelectedOrder(updatedOrder);
      }
    }
  }, [liveOrders, selectedOrder]);

  // DEMO MODE: Force exactly one "Live Caller" tile at the top of Active Orders
  // If we have live data from backend, use the latest one.
  // If not, use a placeholder "Waiting for Call" state.

  const latestLiveOrder = liveOrders.length > 0
    ? liveOrders.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]
    : null;

  // Placeholder if no live call is active

  // Active Orders: ONLY the live one IF it is processing.
  // If it completes (via backend cleanup), it should disappear.
  const mergedActiveOrders = (latestLiveOrder && latestLiveOrder.status === 'processing')
    ? [latestLiveOrder]
    : [];

  // Scheduled Orders: Exactly 2 Mock tiles
  const mergedScheduledOrders = [...ordersByCategory.future.slice(0, 2)];

  // Past Orders: Exactly 2 Mock tiles
  const mergedPastOrders = [...ordersByCategory.past.slice(0, 2)];

  if (selectedOrder) {
    return (
      <div className="container mx-auto px-6 py-6 h-[calc(100vh-80px)]">
        <LiveOrderDetailView
          order={selectedOrder}
          onBack={() => setSelectedOrder(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20" >
      <div className="container mx-auto px-6 py-8">
        {/* Dashboard Header - Futuristic */}
        <div className="mb-8">
          <div className="flex items-end gap-4 mb-2">
            <h1 className="text-2xl font-bold text-foreground tracking-wide font-display">
              Operations Dashboard
            </h1>
            <div className="h-0.5 w-20 bg-gradient-to-r from-accent to-accent/30 rounded-full mb-2" />
          </div>
          <p className="text-muted-foreground text-sm tracking-wide">
            Real-time flight operations monitoring & control
          </p>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full overflow-hidden">
          {/* Past Orders - Left */}
          <OrderColumn
            category="past"
            orders={mergedPastOrders}
            onOrderClick={setSelectedOrder}
          />
          <OrderColumn
            category="active"
            orders={mergedActiveOrders}
            onOrderClick={setSelectedOrder}
          />
          <OrderColumn
            category="future"
            orders={mergedScheduledOrders}
            onOrderClick={setSelectedOrder}
          />
        </div>
      </div>
    </div >
  );
}

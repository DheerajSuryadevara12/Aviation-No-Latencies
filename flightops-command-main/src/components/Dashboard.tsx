import { useState, useEffect, useRef } from 'react';
import { Order } from '@/types/aviation';
import { getOrdersByCategory } from '@/data/mockData';
import { OrderColumn } from './OrderColumn';
import { LiveOrderDetailView } from './LiveOrderDetailView';
import { IncomingCallPopup } from './IncomingCallPopup';

const API_URL = 'http://localhost:3001/api/orders';
const WS_URL = 'ws://localhost:3001';

export function Dashboard() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [incomingCallOrder, setIncomingCallOrder] = useState<Order | null>(null);
  const [pendingCallOrderId, setPendingCallOrderId] = useState<string | null>(null);
  const pendingCallOrderIdRef = useRef<string | null>(null);
  const ordersByCategory = getOrdersByCategory();

  // Keep ref in sync with state so WebSocket closure reads the latest value
  useEffect(() => {
    pendingCallOrderIdRef.current = pendingCallOrderId;
  }, [pendingCallOrderId]);

  // Helper to parse dates from JSON
  const parseOrderDates = (order: any): Order => ({
    ...order,
    arrivalTime: new Date(order.arrivalTime),
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
  });

  // Fetch initial live orders & listen via WebSocket
  useEffect(() => {
    // Reset orders on load to ensure clean state
    fetch(`${API_URL}/reset`, { method: 'POST' })
      .then(() => fetch(API_URL))
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLiveOrders(data.map(parseOrderDates));
        }
      })
      .catch(err => console.error('Failed to reset/fetch orders:', err));

    // Listen for new live orders via WS
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'NEW_ORDER') {
          console.log('WS: Received NEW_ORDER', data.order);
          const parsed = parseOrderDates(data.order);
          setLiveOrders(prev => {
            if (prev.find(o => o.id === parsed.id)) return prev;
            return [...prev, parsed];
          });
          // If phone is already available, show popup immediately
          if (parsed.customer?.phone) {
            setIncomingCallOrder(parsed);
          } else {
            // Store the ID — popup will show when phone arrives via ORDER_UPDATE
            setPendingCallOrderId(parsed.id);
          }
        } else if (data.type === 'ORDER_UPDATE') {
          console.log('WS: Received ORDER_UPDATE', data.order);
          const parsed = parseOrderDates(data.order);
          setLiveOrders(prev =>
            prev.map(o => o.id === parsed.id ? parsed : o)
          );
          // If this is the pending order and now has a phone, show the popup
          if (parsed.customer?.phone && pendingCallOrderIdRef.current === parsed.id) {
            setIncomingCallOrder(parsed);
            setPendingCallOrderId(null);
          }
          // Also update popup if it's already showing this order
          if (parsed.customer?.phone) {
            setIncomingCallOrder(prev => prev?.id === parsed.id ? parsed : prev);
          }
          // If order completed, clear popup
          if (parsed.status === 'completed') {
            setIncomingCallOrder(prev => prev?.id === parsed.id ? null : prev);
            setPendingCallOrderId(null);
          }
        } else if (data.type === 'RESET_ORDERS') {
          console.log('WS: Received RESET_ORDERS');
          setLiveOrders([]);
          setSelectedOrder(null);
          setIncomingCallOrder(null);
          setPendingCallOrderId(null);
        }
      } catch (e) {
        console.error('WS Parse Error', e);
      }
    };

    return () => ws.close();
  }, []);

  // Sync selectedOrder with updates from liveOrders
  useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = liveOrders.find(o => o.id === selectedOrder.id);
      if (updatedOrder && updatedOrder !== selectedOrder) {
        setSelectedOrder(updatedOrder);
      }
    }
  }, [liveOrders, selectedOrder]);

  // Handle "Monitor" click on the popup → open existing LiveOrderDetailView
  const handleMonitorCall = () => {
    if (incomingCallOrder) {
      setSelectedOrder(incomingCallOrder);
      setIncomingCallOrder(null);
    }
  };

  // Handle dismissing the popup (clicking backdrop)
  const handleDismissPopup = () => {
    setIncomingCallOrder(null);
  };

  // Compute dashboard columns
  const latestLiveOrder = liveOrders.length > 0
    ? liveOrders.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]
    : null;

  const mergedActiveOrders = (latestLiveOrder && latestLiveOrder.status === 'processing')
    ? [latestLiveOrder]
    : [];

  const mergedScheduledOrders = [...ordersByCategory.future.slice(0, 2)];
  const mergedPastOrders = [...ordersByCategory.past.slice(0, 2)];

  // Detail view for any order (live or mock)
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-6 py-8">
        {/* Dashboard Header */}
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

      {/* Incoming Call Popup (overlay on dashboard) */}
      {incomingCallOrder && (
        <IncomingCallPopup
          order={incomingCallOrder}
          onMonitor={handleMonitorCall}
          onDismiss={handleDismissPopup}
        />
      )}
    </div>
  );
}

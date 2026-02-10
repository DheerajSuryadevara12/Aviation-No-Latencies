import { Customer, Order, AgentExecution, AgentStep, OrderItem, GroundStaff } from '@/types/aviation';

export const groundStaff: GroundStaff[] = [
  { id: 'GS-001', name: 'Marcus Thompson' },
  { id: 'GS-002', name: 'Sarah Chen' },
  { id: 'GS-003', name: 'James Rodriguez' },
  { id: 'GS-004', name: 'Emily Watson' },
  { id: 'GS-005', name: 'David Kim' },
  { id: 'GS-006', name: 'Lisa Patel' },
];

export const customers: Customer[] = [
  {
    id: 'cust-001',
    phone: '+15550101',
    name: 'Alice Johnson',
    pilotName: 'Capt. Smith',
    planeNumber: 'N123AJ',
  },
  {
    id: 'cust-002',
    phone: '+15550102',
    name: 'Bob Williams',
    pilotName: 'Capt. Doe',
    planeNumber: 'N456BW',
  },
  {
    id: 'cust-003',
    phone: '+15550103',
    name: 'Charlie Brown',
    pilotName: 'Capt. Peanuts',
    planeNumber: 'N789CB',
  },
  {
    id: 'cust-004',
    phone: '+15550104',
    name: 'Diana Prince',
    pilotName: 'Capt. Trevor',
    planeNumber: 'N999WW',
  },
  {
    id: 'cust-005',
    phone: '+15550105',
    name: 'Evan Wright',
    pilotName: 'Capt. Sky',
    planeNumber: 'N321EW',
  },
  {
    id: 'cust-006',
    phone: '+15550199',
    name: 'John Doe',
    pilotName: 'Capt. Test',
    planeNumber: 'N000TEST',
  },
];

const createAgentSteps = (agentType: string): AgentStep[] => [
  { id: `${agentType}-step-1`, label: 'API called', status: 'pending' },
  { id: `${agentType}-step-2`, label: 'Options found', status: 'pending' },
  { id: `${agentType}-step-3`, label: 'Selecting best option', status: 'pending' },
  { id: `${agentType}-step-4`, label: 'Booking', status: 'pending' },
  { id: `${agentType}-step-5`, label: 'Payment processed', status: 'pending' },
];

const createAgentExecution = (
  type: 'refueling' | 'catering' | 'wine' | 'car_rental',
  status: 'pending' | 'in_progress' | 'success' | 'failed',
  stepProgress: number = 0,
  result?: AgentExecution['result'],
  errorMessage?: string
): AgentExecution => {
  const names = {
    refueling: 'Refueling Agent',
    catering: 'Catering Agent',
    wine: 'Wine Agent',
    car_rental: 'Car Rental Agent',
  };

  const steps = createAgentSteps(type);

  // Update step statuses based on progress
  for (let i = 0; i < steps.length; i++) {
    if (i < stepProgress) {
      steps[i].status = 'completed';
      steps[i].timestamp = new Date(Date.now() - (stepProgress - i) * 60000);
    } else if (i === stepProgress && status === 'in_progress') {
      steps[i].status = 'in_progress';
    } else if (status === 'failed' && i === stepProgress) {
      steps[i].status = 'failed';
    }
  }

  return {
    id: `agent-${type}-${Date.now()}`,
    agentType: type,
    agentName: names[type],
    status,
    steps,
    result,
    errorMessage,
    retryCount: status === 'failed' ? 2 : 0,
  };
};

const pastOrders: Order[] = [
  {
    id: 'order-001',
    customerId: 'cust-001',
    customer: customers[0],
    status: 'completed',
    arrivalTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    passengers: 4,
    items: [
      { id: 'item-001', type: 'refueling', description: 'Jet-A Fuel 500gal', status: 'completed' },
      { id: 'item-002', type: 'catering', description: 'Premium lunch for 4', status: 'completed' },
    ],
    agents: [
      createAgentExecution('refueling', 'success', 5, { vendor: 'Atlantic Aviation', price: '$2,450', details: '500 gallons Jet-A' }),
      createAgentExecution('catering', 'success', 5, { vendor: 'Sky Cuisine', price: '$680', details: 'Premium lunch x4' }),
    ],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    assignedStaff: groundStaff[0],
  },
  {
    id: 'order-002',
    customerId: 'cust-002',
    customer: customers[1],
    status: 'completed',
    arrivalTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    passengers: 2,
    items: [
      { id: 'item-004', type: 'refueling', description: 'Jet-A Fuel 300gal', status: 'completed' },
      { id: 'item-005', type: 'wine', description: 'Premium wine selection', status: 'completed' },
    ],
    agents: [
      createAgentExecution('refueling', 'success', 5, { vendor: 'Signature Flight', price: '$1,470', details: '300 gallons Jet-A' }),
      createAgentExecution('wine', 'success', 5, { vendor: 'Vintage Cellars', price: '$890', details: '3 bottles premium selection' }),
    ],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    assignedStaff: groundStaff[1],
  },
];

const activeOrders: Order[] = [
  {
    id: 'order-003',
    customerId: 'cust-003',
    customer: customers[2],
    status: 'processing',
    arrivalTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    passengers: 6,
    items: [
      { id: 'item-006', type: 'refueling', description: 'Jet-A Fuel 800gal', status: 'completed' },
      { id: 'item-007', type: 'catering', description: 'Gourmet dinner for 6', status: 'in_progress' },
      { id: 'item-008', type: 'wine', description: 'Champagne selection', status: 'pending' },
      { id: 'item-009', type: 'car_rental', description: '2x Luxury sedans', status: 'in_progress' },
    ],
    agents: [
      createAgentExecution('refueling', 'success', 5, { vendor: 'Atlantic Aviation', price: '$3,920', details: '800 gallons Jet-A' }),
      createAgentExecution('catering', 'in_progress', 3),
      createAgentExecution('wine', 'pending', 0),
      createAgentExecution('car_rental', 'in_progress', 2),
    ],
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    updatedAt: new Date(),
    specialRequests: 'Vegetarian option needed for 2 guests',
    assignedStaff: groundStaff[2],
  },
  {
    id: 'order-004',
    customerId: 'cust-004',
    customer: customers[3],
    status: 'processing',
    arrivalTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
    passengers: 3,
    items: [
      { id: 'item-010', type: 'refueling', description: 'Jet-A Fuel 400gal', status: 'in_progress' },
      { id: 'item-011', type: 'car_rental', description: 'Executive SUV', status: 'failed' },
    ],
    agents: [
      createAgentExecution('refueling', 'in_progress', 2),
      createAgentExecution('car_rental', 'failed', 3, undefined, 'No vehicles available at requested time. Manual intervention required.'),
    ],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(),
    assignedStaff: groundStaff[3],
  },
];

const futureOrders: Order[] = [
  {
    id: 'order-005',
    customerId: 'cust-005',
    customer: customers[4],
    status: 'scheduled',
    arrivalTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    passengers: 5,
    items: [
      { id: 'item-012', type: 'refueling', description: 'Jet-A Fuel 600gal', status: 'completed' },
      { id: 'item-013', type: 'catering', description: 'Breakfast for 5', status: 'completed' },
      { id: 'item-014', type: 'car_rental', description: 'Luxury van', status: 'completed' },
    ],
    agents: [
      createAgentExecution('refueling', 'success', 5, { vendor: 'Atlantic Aviation', price: '$2,205', details: '450 gallons Jet-A' }),
      createAgentExecution('catering', 'success', 5, { vendor: 'Sky Cuisine', price: '$380', details: 'Continental breakfast' }),
      createAgentExecution('car_rental', 'success', 5, { vendor: 'Enterprise', price: '$180/day', pickupTime: '9:00 AM' }),
    ],
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    assignedStaff: groundStaff[4],
  },
  {
    id: 'order-006',
    customerId: 'cust-006',
    customer: customers[5],
    status: 'scheduled',
    arrivalTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
    passengers: 2,
    items: [
      { id: 'item-015', type: 'refueling', description: 'Jet-A Fuel 250gal', status: 'completed' },
      { id: 'item-016', type: 'wine', description: 'Red wine selection', status: 'completed' },
      { id: 'item-017', type: 'car_rental', description: 'Executive sedan', status: 'completed' },
    ],
    agents: [
      createAgentExecution('refueling', 'success', 5, { vendor: 'Signature Flight', price: '$1,862', details: '380 gallons Jet-A' }),
      createAgentExecution('wine', 'success', 5, { vendor: 'Vintage Cellars', price: '$650', details: 'Sassicaia 2019' }),
      createAgentExecution('car_rental', 'success', 5, { vendor: 'Signature Executive', price: '$290/day', details: 'Mercedes S-Class' }),
    ],
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    specialRequests: 'Prefer Italian wines',
    assignedStaff: groundStaff[5],
  },
];

export const orders: Order[] = [...pastOrders, ...activeOrders, ...futureOrders];

export const getOrdersByCategory = () => {
  const now = new Date();

  return {
    past: orders.filter(o => o.status === 'completed' || o.status === 'cancelled'),
    active: orders.filter(o => o.status === 'processing'),
    future: orders.filter(o => o.status === 'scheduled'),
  };
};

export const getOrderById = (id: string): Order | undefined => {
  return orders.find(o => o.id === id);
};

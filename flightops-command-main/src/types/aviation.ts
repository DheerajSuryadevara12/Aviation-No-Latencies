export interface GroundStaff {
  id: string;
  name: string;
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  pilotName: string;
  planeNumber: string;
}

export interface OrderItem {
  id: string;
  type: 'refueling' | 'catering' | 'wine' | 'car_rental' | 'special_request' | 'dry_cleaning';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  details?: Record<string, string | number>;
}

export interface AgentStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp?: Date;
}

// New agent types for the Reservation Agent orchestration
export type ReservationAgentType =
  | 'ramp_availability'
  | 'customer_lookup'
  | 'services_amenities'
  | 'weather_checker'
  | 'workforce';

// Legacy agent types for backward compatibility
export type LegacyAgentType = 'refueling' | 'catering' | 'wine' | 'car_rental';

export interface AgentExecution {
  id: string;
  agentType: LegacyAgentType;
  agentName: string;
  status: 'pending' | 'in_progress' | 'success' | 'failed';
  steps: AgentStep[];
  result?: {
    vendor?: string;
    price?: string;
    details?: string;
    pickupTime?: string;
    location?: string;
  };
  errorMessage?: string;
  retryCount: number;
}

// New Reservation Agent Execution for the orchestration flow
export interface ReservationAgentExecution {
  id: string;
  agentType: ReservationAgentType;
  agentName: string;
  status: 'pending' | 'in_progress' | 'success' | 'failed';
  currentAction: string;
  steps: AgentStep[];
  result?: {
    summary?: string;
    details?: Record<string, string>;
    available?: boolean;
    recommendations?: string[];
  };
  errorMessage?: string;
}

export interface ChatMessage {
  id: string;
  role: 'pilot' | 'agent';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

export interface ReservationRequest {
  id: string;
  flightNumber: string;
  airport: string;
  requestedTime: Date;
  customer?: Customer;
  status: 'incoming' | 'processing' | 'awaiting_confirmation' | 'confirmed' | 'failed';
  agents: ReservationAgentExecution[];
  messages: ChatMessage[];
  services: {
    catering: boolean;
    champagne: boolean;
    dryCleanig: boolean;
    refueling: boolean;
    carService: boolean;
  };
  createdAt: Date;
}

export interface Order {
  id: string;
  customerId: string;
  customer: Customer;
  status: 'scheduled' | 'processing' | 'completed' | 'failed' | 'cancelled';
  arrivalTime: Date;
  passengers: number;
  items: OrderItem[];
  agents: AgentExecution[];
  createdAt: Date;
  updatedAt: Date;
  specialRequests?: string;
  assignedStaff: GroundStaff;
}

export type OrderCategory = 'past' | 'active' | 'future';

export interface WebSocketMessage {
  type: 'agent_update' | 'order_update' | 'step_update';
  orderId: string;
  agentId?: string;
  stepId?: string;
  data: Partial<AgentExecution> | Partial<Order> | Partial<AgentStep>;
}

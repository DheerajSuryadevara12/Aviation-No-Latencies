import { Order } from '@/types/aviation';

export interface AgentRequestDetails {
  agentType: string;
  specificRequest: string;
  alternatives?: string[];
  unavailable?: boolean;
  unavailableMessage?: string;
  price?: string;
  timeConstraint?: string;
}

export interface ConversationStep {
  delay: number;
  message: {
    id: string;
    role: 'pilot' | 'agent' | 'system';
    content: string;
    timestamp: Date;
    triggersAgents?: string[];
    agentDetails?: AgentRequestDetails[];
    isError?: boolean;
  };
  waitForAgents?: boolean;
}

// Agent request details per customer - specific wines, meals, etc.
export const customerAgentDetails: Record<string, AgentRequestDetails[]> = {
  // Alice Johnson - Completed order - Standard requests
  'cust-001': [
    { agentType: 'refueling', specificRequest: '500 gallons Jet-A fuel', price: '$2,450' },
    { agentType: 'catering', specificRequest: 'Light lunch for 4 passengers', price: '$680' },
  ],

  // Bob Williams - Wine enthusiast - Cabernet Sauvignon
  'cust-002': [
    { agentType: 'refueling', specificRequest: '400 gallons Jet-A fuel', price: '$1,960' },
    { agentType: 'wine', specificRequest: 'Cabernet Sauvignon - Opus One 2018', alternatives: ['Caymus Special Selection 2019', 'Silver Oak Alexander Valley 2018'], price: '$890' },
  ],

  // Charlie Brown - Larger group, special dietary - Caviar unavailable
  'cust-003': [
    { agentType: 'refueling', specificRequest: '600 gallons Jet-A fuel', price: '$2,940' },
    { agentType: 'catering', specificRequest: 'Beluga Caviar appetizer for 8', unavailable: true, unavailableMessage: 'Beluga Caviar is currently unavailable due to import restrictions.', alternatives: ['Osetra Caviar - Premium Grade', 'Kaluga Caviar - Farm Raised', 'Salmon Roe - Norwegian'], price: '+$150 for Osetra, $120 for Kaluga', timeConstraint: 'Can be prepared within 2 hours' },
    { agentType: 'wine', specificRequest: 'Dom Pérignon 2012 - 3 bottles', price: '$1,890' },
    { agentType: 'car_rental', specificRequest: 'Mercedes Sprinter Van for 8 passengers', price: '$450' },
  ],

  // Diana Prince - Car rental ALWAYS fails (SUV unavailable)
  'cust-004': [
    { agentType: 'refueling', specificRequest: '350 gallons Jet-A fuel', price: '$1,715' },
    { agentType: 'catering', specificRequest: 'Gourmet dinner for 3 passengers', price: '$520' },
    { agentType: 'car_rental', specificRequest: 'Luxury SUV - Cadillac Escalade', unavailable: true, unavailableMessage: 'No Cadillac Escalade available. All luxury SUVs are currently reserved.', alternatives: ['Lincoln Navigator - Available in 3 hours', 'Mercedes GLS - Available now at partner location', 'BMW X7 - Available tomorrow'], price: 'Navigator: $280/day, GLS: $320/day (+$50 delivery)', timeConstraint: 'Earliest available: 3 hours' },
  ],

  // Evan Wright - Planning ahead, specific champagne
  'cust-005': [
    { agentType: 'refueling', specificRequest: '450 gallons Jet-A fuel', price: '$2,205' },
    { agentType: 'catering', specificRequest: 'Continental breakfast for 5 passengers', price: '$380' },
    { agentType: 'wine', specificRequest: 'Krug Grande Cuvée Champagne - 2 bottles', alternatives: ['Louis Roederer Cristal 2014', 'Perrier-Jouët Belle Epoque'], price: '$720' },
  ],

  // John Doe - Italian wine preference
  'cust-006': [
    { agentType: 'refueling', specificRequest: '380 gallons Jet-A fuel', price: '$1,862' },
    { agentType: 'wine', specificRequest: 'Sassicaia 2019 - Italian Super Tuscan', alternatives: ['Tignanello 2018', 'Ornellaia 2019'], price: '$650' },
    { agentType: 'car_rental', specificRequest: 'Executive sedan - Mercedes S-Class', price: '$290/day' },
  ],
};

// Get agent-specific details for display in agent cards
export function getAgentDetailsForOrder(order: Order): AgentRequestDetails[] {
  return customerAgentDetails[order.customerId] || [];
}

// Get conversation flow for each customer
export function getConversationForOrder(order: Order): ConversationStep[] {
  const pilotName = order.customer.pilotName;
  const planeNumber = order.customer.planeNumber;
  const arrivalTime = order.arrivalTime;
  const passengers = order.passengers;

  // Get agent details for this customer
  const agentDetails = customerAgentDetails[order.customerId] || [];
  const requestedServices = agentDetails.map(d => d.agentType);

  // Build service request text from agent details
  const serviceRequests = agentDetails.map(d => {
    if (d.agentType === 'refueling') return d.specificRequest;
    if (d.agentType === 'catering') return d.specificRequest;
    if (d.agentType === 'wine') return d.specificRequest;
    if (d.agentType === 'car_rental') return d.specificRequest;
    return d.specificRequest;
  });

  // Customer-specific conversations
  switch (order.customerId) {
    // Alice Johnson - Completed order (past) - Professional, quick
    case 'cust-001':
      return [
        { delay: 200, message: { id: 'msg-1', role: 'system', content: 'Incoming call connected...', timestamp: new Date() } },
        { delay: 500, message: { id: 'msg-2', role: 'agent', content: 'Good morning, FBO Operations. How may I assist you today?', timestamp: new Date() } },
        { delay: 1200, message: { id: 'msg-3', role: 'pilot', content: `Hi, this is ${pilotName} on tail number ${planeNumber}. I'm a regular here.`, timestamp: new Date() } },
        { delay: 1800, message: { id: 'msg-4', role: 'agent', content: `Good morning, ${pilotName.split(' ')[0]}! I see your profile. Flying with ${passengers} passengers today. What can I arrange?`, timestamp: new Date() } },
        { delay: 2500, message: { id: 'msg-5', role: 'pilot', content: `We need ${serviceRequests.join(' and ')}.`, timestamp: new Date(), triggersAgents: requestedServices, agentDetails } },
        { delay: 3200, message: { id: 'msg-6', role: 'agent', content: 'Processing your requests now. You\'ll see each service status on the right.', timestamp: new Date() }, waitForAgents: true },
      ];

    // Bob Williams - Wine enthusiast, specific Cabernet request
    case 'cust-002':
      return [
        { delay: 200, message: { id: 'msg-1', role: 'system', content: 'Incoming call connected...', timestamp: new Date() } },
        { delay: 500, message: { id: 'msg-2', role: 'agent', content: 'FBO Operations, good afternoon. May I have your name and tail number?', timestamp: new Date() } },
        { delay: 1200, message: { id: 'msg-3', role: 'pilot', content: `${pilotName} here, flying ${planeNumber}.`, timestamp: new Date() } },
        { delay: 1800, message: { id: 'msg-4', role: 'agent', content: `Welcome back, ${pilotName.split(' ')[0]}! I see you usually request our premium wine selection. Any preference today?`, timestamp: new Date() } },
        { delay: 2500, message: { id: 'msg-5', role: 'pilot', content: `Yes, I'd like the Opus One 2018 Cabernet Sauvignon specifically. Also need fuel - about 400 gallons of Jet-A.`, timestamp: new Date(), triggersAgents: requestedServices, agentDetails } },
        { delay: 3200, message: { id: 'msg-6', role: 'agent', content: 'Excellent choice on the Opus One! Let me check availability and arrange the fuel.', timestamp: new Date() }, waitForAgents: true },
      ];

    // Charlie Brown - Larger group, CAVIAR UNAVAILABLE scenario
    case 'cust-003':
      return [
        { delay: 200, message: { id: 'msg-1', role: 'system', content: 'Incoming call connected...', timestamp: new Date() } },
        { delay: 500, message: { id: 'msg-2', role: 'agent', content: 'Good afternoon, FBO Operations. How can I assist you?', timestamp: new Date() } },
        { delay: 1200, message: { id: 'msg-3', role: 'pilot', content: `This is ${pilotName}, tail ${planeNumber}. We have a larger group - ${passengers} passengers.`, timestamp: new Date() } },
        { delay: 1800, message: { id: 'msg-4', role: 'agent', content: `Thank you, Captain. ${passengers} passengers - that's a nice group! When do you expect to arrive?`, timestamp: new Date() } },
        { delay: 2500, message: { id: 'msg-5', role: 'pilot', content: `Around ${arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. We need the full treatment - Beluga Caviar as appetizer, Dom Pérignon, the Sprinter van, and of course fuel.`, timestamp: new Date(), triggersAgents: requestedServices, agentDetails } },
        { delay: 3200, message: { id: 'msg-6', role: 'agent', content: 'Let me check all those services. I\'ll confirm availability for each item.', timestamp: new Date() }, waitForAgents: true },
      ];

    // Diana Prince - ALWAYS FAILS (car rental unavailable, needs human)
    case 'cust-004':
      return [
        { delay: 200, message: { id: 'msg-1', role: 'system', content: 'Incoming call connected...', timestamp: new Date() } },
        { delay: 500, message: { id: 'msg-2', role: 'agent', content: 'FBO Operations, good day. May I have your details?', timestamp: new Date() } },
        { delay: 1200, message: { id: 'msg-3', role: 'pilot', content: `${pilotName}, aircraft ${planeNumber}. We need services for today.`, timestamp: new Date() } },
        { delay: 1800, message: { id: 'msg-4', role: 'agent', content: `Hello ${pilotName.split(' ')[0]}! I have your profile. ${passengers} passengers. What do you need?`, timestamp: new Date() } },
        { delay: 2500, message: { id: 'msg-5', role: 'pilot', content: `Fuel, gourmet dinner for 3, and we absolutely need a Cadillac Escalade - we have equipment to transport.`, timestamp: new Date(), triggersAgents: requestedServices, agentDetails } },
        { delay: 3200, message: { id: 'msg-6', role: 'agent', content: 'Understood! Let me check vehicle availability and arrange the other services.', timestamp: new Date() }, waitForAgents: true },
      ];

    // Evan Wright - Scheduled (future), champagne preference
    case 'cust-005':
      return [
        { delay: 200, message: { id: 'msg-1', role: 'system', content: 'Incoming call connected...', timestamp: new Date() } },
        { delay: 500, message: { id: 'msg-2', role: 'agent', content: 'Good morning, FBO Operations. How may I help you today?', timestamp: new Date() } },
        { delay: 1200, message: { id: 'msg-3', role: 'pilot', content: `Hi there, ${pilotName} here. I'm calling to schedule ahead. Tail number ${planeNumber}.`, timestamp: new Date() } },
        { delay: 1800, message: { id: 'msg-4', role: 'agent', content: `Smart planning, ${pilotName.split(' ')[0]}! What time are you expecting to arrive?`, timestamp: new Date() } },
        { delay: 2500, message: { id: 'msg-5', role: 'pilot', content: `Should be around ${arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} with ${passengers} passengers. We'd like Krug Grande Cuvée - 2 bottles, continental breakfast, and fuel.`, timestamp: new Date(), triggersAgents: requestedServices, agentDetails } },
        { delay: 3200, message: { id: 'msg-6', role: 'agent', content: 'Great taste! Let me pre-arrange everything for your arrival.', timestamp: new Date() }, waitForAgents: true },
      ];

    // John Doe - Italian wine preference
    case 'cust-006':
      return [
        { delay: 200, message: { id: 'msg-1', role: 'system', content: 'Incoming call connected...', timestamp: new Date() } },
        { delay: 500, message: { id: 'msg-2', role: 'agent', content: 'FBO Operations, good afternoon. What can I do for you?', timestamp: new Date() } },
        { delay: 1200, message: { id: 'msg-3', role: 'pilot', content: `${pilotName} on ${planeNumber}. Planning for a trip in a couple days.`, timestamp: new Date() } },
        { delay: 1800, message: { id: 'msg-4', role: 'agent', content: `Hello ${pilotName.split(' ')[0]}! I see from your notes you prefer Italian wines. Is that still the case?`, timestamp: new Date() } },
        { delay: 2500, message: { id: 'msg-5', role: 'pilot', content: `Exactly! I'd like Sassicaia 2019 if available. Also need fuel and a Mercedes S-Class for ground transport.`, timestamp: new Date(), triggersAgents: requestedServices, agentDetails } },
        { delay: 3200, message: { id: 'msg-6', role: 'agent', content: 'Sassicaia - excellent Super Tuscan choice! Let me confirm everything.', timestamp: new Date() }, waitForAgents: true },
      ];

    // Default conversation
    default:
      return [
        { delay: 200, message: { id: 'msg-1', role: 'system', content: 'Incoming call connected...', timestamp: new Date() } },
        { delay: 500, message: { id: 'msg-2', role: 'agent', content: 'FBO Operations, how may I assist you?', timestamp: new Date() } },
        { delay: 1200, message: { id: 'msg-3', role: 'pilot', content: `${pilotName}, tail ${planeNumber}.`, timestamp: new Date() } },
        { delay: 1800, message: { id: 'msg-4', role: 'agent', content: `Hello ${pilotName.split(' ')[0]}! What services do you need?`, timestamp: new Date() } },
        { delay: 2500, message: { id: 'msg-5', role: 'pilot', content: `We need ${serviceRequests.join(', ')}.`, timestamp: new Date(), triggersAgents: requestedServices, agentDetails } },
        { delay: 3200, message: { id: 'msg-6', role: 'agent', content: 'Processing now!', timestamp: new Date() }, waitForAgents: true },
      ];
  }
}

// Generate transcript from conversation history for the summary panel
export function getStoredConversationForOrder(order: Order): { role: 'pilot' | 'agent'; content: string; timestamp: Date }[] {
  const flow = getConversationForOrder(order);

  // Filter out system messages and add final summary based on order status
  const transcript = flow
    .filter(step => step.message.role !== 'system')
    .map(step => ({
      role: step.message.role as 'pilot' | 'agent',
      content: step.message.content,
      timestamp: new Date(order.createdAt.getTime() + step.delay),
    }));

  // Add completion messages based on status
  if (order.status === 'completed') {
    const agentDetails = customerAgentDetails[order.customerId] || [];
    const successResults = agentDetails
      .filter(d => !d.unavailable)
      .map(d => `${d.agentType}: ${d.specificRequest} - ${d.price}`);

    transcript.push({
      role: 'agent',
      content: `All services confirmed! ${successResults.join('; ')}. Everything will be ready on arrival.`,
      timestamp: new Date(order.updatedAt),
    });
    transcript.push({
      role: 'pilot',
      content: 'Perfect, thank you for your help!',
      timestamp: new Date(order.updatedAt.getTime() + 2000),
    });
  } else if (order.status === 'processing' && (order.agents || []).some(a => a.status === 'failed')) {
    transcript.push({
      role: 'agent',
      content: 'I apologize, but we\'ve encountered an issue with one of your requests. I\'m escalating this to a human agent immediately.',
      timestamp: new Date(order.updatedAt),
    });
  }

  return transcript;
}

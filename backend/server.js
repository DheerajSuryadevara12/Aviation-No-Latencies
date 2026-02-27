require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const OpenAI = require('openai');

const app = express();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(port, () => {
    console.log(`Backend server listening on port ${port}`);
});

const wss = new WebSocket.Server({ server });

// Store live orders in memory
let liveOrders = [];
let pendingCallerPhone = null; // Stores phone from Twilio callback until order is created

// HARDCODED PILOT PROFILE FOR DEMO
const ROBIN_HOOD_PROFILE = {
    customerId: 'cust-robin-hood',
    customer: {
        id: 'cust-robin-hood',
        name: 'Robin Hood',
        phone: '+15550199',
        pilotName: 'Capt. Hood',
        planeNumber: 'N555RH'
    }
};

// Known pilot lookup by phone number (ANI)
const KNOWN_PILOTS = {
    '+19405953588': 'Shane',
    '+12144573993': 'Peter',
    '+12408543253': 'Rohan',
};

// Aircraft lookup by tail number
const AIRCRAFT_LOOKUP = {
    'N945TR': 'Lear-Jet 45',
    'N917S': 'Dassault-Falcon 2000',
    'N904LO': 'Embraer-Embraer ERJ-135',
    'N877GS': 'Cirrus-SR-20',
    'N874I': 'Gulfstream-IV',
    'N872WQ': 'Cirrus-SR-20',
    'N817SU': 'Raytheon-Hawker-800XP',
    'N809TZ': 'Embraer-Embraer Legacy',
    'N800KY': 'Dassault-Falcon 900',
    'N763DO': 'Gulfstream-IV',
    'N712AQ': 'Embraer-Embraer ERJ-135',
    'N619GM': 'Gulfstream-V',
    'N579RR': 'Dassault-Falcon 900EX',
    'N560CH': 'Cessna Citation-V',
    'N555LK': 'Lear-Jet 45',
    'N521WR': 'Cirrus-SR-20',
    'N457DS': 'Bombardier-Global 5000',
    'N399FJ': 'Embraer-Embraer ERJ-135',
    'N358RN': 'Rockwell Twins Commander-500',
    'N315TQ': 'Boeing-737-BBJ',
    'N314TI': 'Gulfstream-V',
    'N311LE': 'Cirrus-SR-20',
    'N270SP': 'Gulfstream-IV',
    'N242GV': 'Gulfstream-G550',
    'N222LL': 'Gulfstream-V',
    'N220A': 'Lear-Jet 60',
    'N204RW': 'Cirrus-SR-20',
    'N165JJ': 'Lear-Jet 45',
    'N1643H': 'Embraer-Embraer ERJ-135',
};

// Detect tail number from a message and update the order
function detectTailNumber(message, order) {
    // Match FAA-style tail numbers: N followed by 1-5 alphanumeric chars
    const tailMatch = message.match(/\b(N\d{1,5}[A-Z]{0,2})\b/i);
    if (tailMatch) {
        const tailNumber = tailMatch[1].toUpperCase();
        const aircraftType = AIRCRAFT_LOOKUP[tailNumber] || '';

        if (order.customer) {
            order.customer.planeNumber = tailNumber;
        }
        order.aircraftType = aircraftType;
        order.updatedAt = new Date();
        console.log(`Detected tail number: ${tailNumber} → Aircraft: ${aircraftType || 'Unknown'}`);
        broadcastUpdate(order);
        return true;
    }
    return false;
}

// Cleanup stale orders every 2 seconds
setInterval(() => {
    const now = new Date();
    liveOrders.forEach(order => {
        if (order.status === 'processing') {
            const timeSinceUpdate = now - new Date(order.updatedAt);
            if (timeSinceUpdate > 300000) { // Increased to 5 minutes for demo stability
                console.log(`Order ${order.id} timed out. Marking as completed.`);
                order.status = 'completed';
                broadcastUpdate(order);
            }
        }
    });
}, 2000);

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.send(JSON.stringify({
        type: 'INITIAL_STATE',
        orders: liveOrders
    }));
});

function broadcastUpdate(order) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'ORDER_UPDATE',
                order: order
            }));
        }
    });
}

function broadcastNewOrder(order) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'NEW_ORDER',
                order: order
            }));
        }
    });
}

function broadcastTranscript(orderId, role, message, triggeredAgents) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'TRANSCRIPT',
                orderId: orderId,
                role: role,
                message: message,
                triggered_agents: triggeredAgents
            }));
        }
    });
}

function getOrCreateActiveOrder(callerPhone) {
    // Use explicit callerPhone, or fall back to pending Twilio phone
    const phone = callerPhone || pendingCallerPhone;
    // For demo: Always return the single active order if it exists and is recent (last 5 mins)
    // Otherwise create a new one.
    let order = liveOrders.find(o => o.status === 'processing');

    if (!order) {
        const now = new Date();
        const newId = 'live-order-' + Date.now();
        // Always use real data for live orders — no mock fallback
        const pilotName = phone ? (KNOWN_PILOTS[phone] || '') : '';
        const customerProfile = {
            customerId: 'cust-' + Date.now(),
            customer: {
                id: 'cust-' + Date.now(),
                name: pilotName || 'Unknown Caller',
                phone: phone || '',
                pilotName: pilotName,
                planeNumber: ''
            }
        };

        // Clear pending phone once used
        if (pendingCallerPhone) pendingCallerPhone = null;

        order = {
            id: newId,
            ...customerProfile,
            status: 'processing',
            arrivalTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // +2 hours
            passengers: 0,
            items: [],
            triggeredAgents: [],
            transcript: [],
            createdAt: now,
            updatedAt: now,
            isIdentifying: false
        };
        liveOrders.push(order);
        console.log('Created new live order:', newId, callerPhone ? `for ${callerPhone}` : 'for Robin Hood');
        broadcastNewOrder(order);
    }
    return order;
}

// Twilio Status Callback — captures caller phone number before ElevenLabs webhooks arrive
app.post('/twilio-call-start', (req, res) => {
    const callerPhone = req.body.From || req.body.Caller;
    const callSid = req.body.CallSid;
    console.log(`Twilio call started — From: ${callerPhone}, CallSid: ${callSid}`);

    if (callerPhone) {
        pendingCallerPhone = callerPhone;
        console.log(`Stored pending caller phone: ${callerPhone}`);

        // If an active order already exists (ElevenLabs webhook arrived first), update it
        const existingOrder = liveOrders.find(o => o.status === 'processing');
        const pilotName = KNOWN_PILOTS[callerPhone] || '';
        if (existingOrder && existingOrder.customer) {
            existingOrder.customer.phone = callerPhone;
            existingOrder.customer.name = pilotName || 'Unknown Caller';
            existingOrder.customer.pilotName = pilotName;
            existingOrder.updatedAt = new Date();
            console.log(`Updated existing order ${existingOrder.id} with phone: ${callerPhone}, pilot: ${pilotName || 'Unknown'}`);
            broadcastUpdate(existingOrder);
        }
    }

    // Twilio expects a TwiML or 200 response
    res.status(200).type('text/xml').send('<Response/>');
});

app.get('/api/orders', (req, res) => {
    res.json(liveOrders);
});

app.post('/api/orders/reset', (req, res) => {
    liveOrders = [];
    console.log('Reset active orders requested by client.');
    // Broadcast reset to all clients to clear their specific views
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'RESET_ORDERS' }));
        }
    });
    res.json({ success: true });
});

app.post('/webhook', async (req, res) => {
    const payload = req.body;
    console.log('Received webhook:', JSON.stringify(payload, null, 2));

    // 1. Handle Tool Calls (Client Side Tools / Webhook Tools)
    if (payload.type === 'tool_call' || (payload.tool_calls && payload.tool_calls.length > 0)) {
        const callerPhone = payload.phone_number || payload.caller_number || payload.from;
        const order = getOrCreateActiveOrder(callerPhone);
        order.updatedAt = new Date();

        const toolCall = payload.type === 'tool_call' ? payload : payload.tool_calls[0];
        const toolName = toolCall.name || toolCall.function?.name;
        const toolArgs = toolCall.arguments || toolCall.function?.arguments;

        let args = typeof toolArgs === 'string' ? JSON.parse(toolArgs) : toolArgs;

        console.log(`Processing Tool Call: ${toolName}`, args);

        // escalate_call is now handled via transcript analysis (no separate tool needed)

        // add_service tool logic (Deprecated/Fallback)
        if (toolName === 'add_service') {
            // ... logic kept generic or minimal as we don't expect it used
            return res.json({ result: "Service confirmed manually." });
        }

        return res.json({ result: "Tool processed." });
    }

    // 2. Handle Transcript Logging
    // Supports combined reporting: { user_text: "...", agent_text: "..." }
    const userText = payload.user_text || payload.user_transcript;
    const agentText = payload.agent_text || payload.agent_response || payload.text;

    if (userText || agentText) {
        const callerPhone = payload.phone_number || payload.caller_number || payload.from;
        const order = getOrCreateActiveOrder(callerPhone);
        order.updatedAt = new Date();

        // Helper for OpenAI Analysis
        const analyzeIntent = async (role, message) => {
            if (!process.env.OPENAI_API_KEY) return;
            try {
                // Context from last 3 messages
                const recentContext = order.transcript.slice(-4, -1).map(t => `${t.role.toUpperCase()}: "${t.message}"`).join("\n");

                const completion = await openai.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: `Analyze the message to detect Service Intents for a generic FBO context.
                
                Services: transport, refueling, catering, wine, reservation.
                
                Use the provided CONTEXT to interpret the message.
                
                If Speaker is USER (Pilot):
                - Detect if they are REQUESTING a service.
                - "Landing", "Arrival", "Parking" -> "reservation" (Search).
                - Providing Tail Number (e.g., "N12345") -> "reservation" (Search).
                - Providing Landing Time (e.g., "5pm") -> "reservation" (Search).
                - "Fuel" -> "refueling" (Search).
                - "Car", "rental", "limo" -> "transport" (Search).
                - "Food", "Catering", "Sandwich", "Coffee", "Meal" -> "catering" (Search).
                - "Wine", "Alcohol", "Drink" -> "wine" (Search).
                - Action: "search"
                
                EMERGENCY DETECTION (HIGHEST PRIORITY):
                - If the USER mentions: "engine failure", "emergency", "mayday", "fire", "fuel leak", "medical", "bird strike", "landing gear", or any safety-critical situation:
                  Return: { "services": [{ "type": "urgent", "action": "finalize", "details": "[brief description of the emergency]" }] }
                - If the AGENT says "escalating", "transferring to duty manager", or "emergency":
                  Return: { "services": [{ "type": "urgent", "action": "finalize", "details": "[brief description]" }] }
                - URGENT overrides ALL other intents. If emergency detected, return ONLY the urgent service.

                If Speaker is AGENT (GSS):
                - Detect if they are CONFIRMING/FINALIZING a service.
                - "Booked arrival", "booked your arrival", "Confirmed landing", "Marked arrival", "I have booked your arrival" -> "reservation" (Finalize).
                - "Arranged car", "Confirmed rental", "Booked vehicle", "arranged a" + car model -> "transport" (Finalize).
                - "Arranged fuel", "Confirmed refueling" -> "refueling" (Finalize).
                - "Arranged catering", "Confirmed food", "Meals" -> "catering" (Finalize).
                - "Arranged wine", "Confirmed drinks" -> "wine" (Finalize).
                - AGENT QUESTION RULE: If the agent ASKS about a service or SUGGESTS services (e.g., "such as fuel or transportation?", "Is there any specific service you would like to request?"), do NOT return any NEW intent for the question part. BUT if the SAME message ALSO contains a confirmation (e.g., "I have booked your arrival"), you MUST STILL return the finalize for that confirmation. The question does NOT cancel the confirmation.
                  EXAMPLE: "Confirmed. I have booked your arrival for two hours from now. Is there any specific service you would like to request?" => RETURN: [{"type":"reservation","action":"finalize","details":"arrival booked for two hours"}] (the question is IGNORED, the booking is FINALIZED).
                
                CRITICAL RULES:
                - If multiple services are mentioned, return multiple objects. "chicken sandwich and red wine" = TWO services: catering + wine. ALWAYS return BOTH.
                - Do NOT mix details. "Arrival at 9am" -> "reservation". "Toyota Camry" -> "transport". "red wine" -> "wine" (NOT catering).
                - ALWAYS separate food items (catering) from wine/alcohol items (wine). They are DIFFERENT services. Never group wine under catering.
                - A single message can contain MULTIPLE intents. "Confirmed arrival... also arranged chicken sandwich and red wine" = reservation(finalize) + catering(finalize) + wine(finalize).
                - If the agent asks a question about a service (e.g., "regarding the rental car"), that is NOT a finalize. Only return generic "search" or nothing for that part. Confirmations must be explicit ("Confirmed", "Arranged", "placed", "booked").
                - UPSELL RULE: If the agent mentions a PAST order ("Last time you ordered...") or asks "Would you like to order the same?", do NOT return ANY intent (no search, no finalize) for catering or wine. Return EMPTY for those. BUT you MUST STILL return reservation(finalize) if the same message also says "booked arrival" or "confirmed arrival".
                  EXAMPLE: "Confirmed. I have booked your arrival for 4 hours. Last time you ordered a chicken sandwich and red wine. Would you like to order the same again?" => RETURN: [{"type":"reservation","action":"finalize","details":"arrival booked for 4 hours"}] (catering/wine are EXCLUDED because of upsell).
                - ACTIVE RESERVATION RULE: If the agent says "found your active reservation" or "already have" + food item + "on order" or "Would you like to add more services to this reservation?", return action: "cancel" for reservation AND catering. These are EXISTING services, not new ones.
                  EXAMPLE: "Welcome! I found your active reservation. Tail N874I, landing tomorrow at 2:00 PM. I see you already have a chicken sandwich on order." => RETURN: [{"type":"reservation","action":"cancel"},{"type":"catering","action":"cancel"}]
                - DECLINE RULE: If the USER says "No", "I don't want", "No thanks", or declines a service, return action: "cancel" for that service type.
                - Action: "finalize" (only for explicit confirmations of current requests)
                
                Return JSON: { "services": [ { "type": "transport", "action": "search"|"finalize"|"cancel", "details": "optional summary" } ] }
                If no clear intent, return { "services": [] }.`
                        },
                        { role: "user", content: `Context:\n${recentContext}\n\nCurrent Message to Analyze:\nSpeaker: ${role.toUpperCase()}\nMessage: "${message}"` }
                    ],
                    model: "gpt-3.5-turbo",
                    response_format: { type: "json_object" },
                });

                const result = JSON.parse(completion.choices[0].message.content);
                const detectedServices = result.services || [];
                console.log(`OpenAI parsed (${role}): ${JSON.stringify(detectedServices)}`);

                // Check if this is an active reservation pilot (N874I)
                const allMessages = order.transcript.map(t => (t.message || '').toLowerCase()).join(' ');
                const isActiveReservation = /n\s*8\s*7\s*4\s*i/i.test(allMessages) || allMessages.includes('found your active reservation');

                // If active reservation, suppress reservation and catering triggers (they already exist)
                const filteredServices = isActiveReservation
                    ? detectedServices.filter(s => s.type !== 'reservation' && s.type !== 'catering')
                    : detectedServices;

                // Also cancel any existing reservation/catering agents if active reservation detected
                if (isActiveReservation && order.triggeredAgents.some(a => a.id === 'reservation' || a.id === 'catering')) {
                    order.triggeredAgents = order.triggeredAgents.filter(a => a.id !== 'reservation' && a.id !== 'catering');
                    broadcastUpdate(order);
                }

                const agentTypeMap = { 'transport': 'car_rental' };

                filteredServices.forEach(intent => {
                    const serviceType = intent.type;
                    const agentId = agentTypeMap[serviceType] || serviceType;
                    const validAgents = ['car_rental', 'refueling', 'catering', 'wine', 'reservation', 'urgent'];

                    if (agentId === 'urgent') {
                        // Emergency: Replace ALL agents with urgent
                        console.log(`🚨 EMERGENCY DETECTED: ${intent.details}`);
                        order.triggeredAgents = [{ id: 'urgent', details: intent.details || 'Emergency', action: 'finalize' }];
                        broadcastUpdate(order);
                        return;
                    }

                    if (validAgents.includes(agentId)) {
                        const existing = order.triggeredAgents.find(a => a.id === agentId);
                        if (intent.action === 'cancel') {
                            // Remove the agent if user declined
                            if (existing) {
                                console.log(`CANCELLING agent: ${agentId}`);
                                order.triggeredAgents = order.triggeredAgents.filter(a => a.id !== agentId);
                                broadcastUpdate(order);
                            }
                        } else if (intent.action === 'search') {
                            if (!existing) {
                                console.log(`Triggering SEARCH for: ${agentId}`);
                                order.triggeredAgents.push({
                                    id: agentId,
                                    details: intent.details || `Listening for ${serviceType}...`,
                                    action: 'search'
                                });
                                broadcastUpdate(order);
                            }
                        } else if (intent.action === 'finalize') {
                            console.log(`Triggering FINALIZE for: ${agentId}`);
                            if (existing) {
                                existing.action = 'finalize';
                                if (intent.details) existing.details = intent.details;
                            } else {
                                order.triggeredAgents.push({
                                    id: agentId,
                                    details: intent.details || `${serviceType} confirmed`,
                                    action: 'finalize'
                                });
                            }
                            broadcastUpdate(order);
                        }
                    }
                });
            } catch (error) {
                console.error("OpenAI analysis failed:", error);
            }
        };

        // 1. Process User Input first (if present)
        if (userText) {
            let cleanUserText = userText;
            if (cleanUserText.toLowerCase().startsWith('user:')) cleanUserText = cleanUserText.substring(5).trim();

            // Only add if not duplicate of last message (debounce)
            const lastMsg = order.transcript[order.transcript.length - 1];
            if (!lastMsg || lastMsg.role !== 'pilot' || lastMsg.content !== cleanUserText) {
                order.transcript.push({ role: 'pilot', content: cleanUserText, timestamp: new Date() });
                console.log(`Transcript parsed - Role: pilot, Message: ${cleanUserText}`);
                broadcastTranscript(order.id, 'pilot', cleanUserText, order.triggeredAgents);
                // Detect tail number from pilot message
                detectTailNumber(cleanUserText, order);
                await analyzeIntent('pilot', cleanUserText);
            }
        }

        // 2. Process Agent Response second (if present)
        if (agentText) {
            let cleanAgentText = agentText;
            if (cleanAgentText.toLowerCase().startsWith('agent:')) cleanAgentText = cleanAgentText.substring(6).trim();

            order.transcript.push({ role: 'agent', content: cleanAgentText, timestamp: new Date() });
            console.log(`Transcript parsed - Role: agent, Message: ${cleanAgentText}`);
            broadcastTranscript(order.id, 'agent', cleanAgentText, order.triggeredAgents);
            await analyzeIntent('agent', cleanAgentText);

            // Check for call completion
            const lowerMsg = cleanAgentText.toLowerCase();
            if (lowerMsg.includes('goodbye') || lowerMsg.includes('have a nice day')) {
                setTimeout(() => {
                    order.status = 'completed';
                    broadcastUpdate(order);
                }, 5000);
            }
        }

        // broadcastUpdate(order); // Redundant if we broadcast transcript
        return res.status(200).send("Transcript logged.");
    }

    res.status(200).send('OK');
});

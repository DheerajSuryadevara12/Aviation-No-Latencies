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

const port = 3001;

app.use(cors());
app.use(bodyParser.json());

const server = app.listen(port, () => {
    console.log(`Backend server listening on port ${port}`);
});

const wss = new WebSocket.Server({ server });

// Store live orders in memory
let liveOrders = [];

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

function getOrCreateActiveOrder() {
    // For demo: Always return the single active order if it exists and is recent (last 5 mins)
    // Otherwise create a new one.
    let order = liveOrders.find(o => o.status === 'processing');

    if (!order) {
        const now = new Date();
        const newId = 'live-order-' + Date.now();
        order = {
            id: newId,
            ...ROBIN_HOOD_PROFILE, // ALWAYS USE ROBIN HOOD
            status: 'processing',
            arrivalTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // +2 hours
            passengers: 4,
            items: [],
            triggeredAgents: [],
            transcript: [],
            createdAt: now,
            updatedAt: now,
            isIdentifying: false // Since we hardcode Robin Hood, we skip "identifying" state
        };
        liveOrders.push(order);
        console.log('Created new live order for Robin Hood:', newId);
        broadcastNewOrder(order);
    }
    return order;
}

app.get('/api/orders', (req, res) => {
    res.json(liveOrders);
});

app.post('/webhook', async (req, res) => {
    const payload = req.body;
    console.log('Received webhook:', JSON.stringify(payload, null, 2));

    // 1. Handle Tool Calls (Client Side Tools / Webhook Tools)
    if (payload.type === 'tool_call' || (payload.tool_calls && payload.tool_calls.length > 0)) {
        const order = getOrCreateActiveOrder();
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
        const order = getOrCreateActiveOrder();
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
                - "Booked arrival", "Confirmed landing", "Marked arrival" -> "reservation" (Finalize).
                - "Arranged car", "Confirmed rental", "Booked vehicle" -> "transport" (Finalize).
                - "Arranged fuel", "Confirmed refueling" -> "refueling" (Finalize).
                - "Arranged catering", "Confirmed food", "Meals" -> "catering" (Finalize).
                - "Arranged wine", "Confirmed drinks" -> "wine" (Finalize).
                
                CRITICAL RULES:
                - If multiple services are mentioned, return multiple objects. "chicken sandwich and red wine" = TWO services: catering + wine. ALWAYS return BOTH.
                - Do NOT mix details. "Arrival at 9am" -> "reservation". "Toyota Camry" -> "transport". "red wine" -> "wine" (NOT catering).
                - ALWAYS separate food items (catering) from wine/alcohol items (wine). They are DIFFERENT services. Never group wine under catering.
                - A single message can contain MULTIPLE intents. "Confirmed arrival... also arranged chicken sandwich and red wine" = reservation(finalize) + catering(finalize) + wine(finalize).
                - If the agent asks a question about a service (e.g., "regarding the rental car"), that is NOT a finalize. Only return generic "search" or nothing for that part. Confirmations must be explicit ("Confirmed", "Arranged", "placed", "booked").
                - UPSELL RULE: If the agent mentions a PAST order ("Last time you ordered...") or asks "Would you like to order the same?", do NOT return ANY intent (no search, no finalize) for catering or wine. Return EMPTY for those. BUT you MUST STILL return reservation(finalize) if the same message also says "booked arrival" or "confirmed arrival".
                  EXAMPLE: "Confirmed. I have booked your arrival for 4 hours. Last time you ordered a chicken sandwich and red wine. Would you like to order the same again?" => RETURN: [{"type":"reservation","action":"finalize","details":"arrival booked for 4 hours"}] (catering/wine are EXCLUDED because of upsell).
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

                const agentTypeMap = { 'transport': 'car_rental' };

                detectedServices.forEach(intent => {
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

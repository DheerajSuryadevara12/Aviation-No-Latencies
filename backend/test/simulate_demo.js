// node-fetch v3 is ESM-only. Use dynamic import.
const BASE_URL = 'http://localhost:3001/webhook';
const DELAY_MS = 2000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sendWebhook(payload) {
    const { default: fetch } = await import('node-fetch');
    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log(`Sent: ${JSON.stringify(payload).substring(0, 50)}... Status: ${response.status}`);
    } catch (error) {
        console.error('Error sending webhook:', error);
    }
}

async function runDemo() {
    console.log("Starting Demo Simulation...");

    // 1. User: "I'm looking for a car rental."
    await sendWebhook({ text: "User: I'm looking for a car rental." });
    await sleep(DELAY_MS);

    // 2. Agent: "I can help with that, but first I need your tail number..."
    await sendWebhook({ text: "Agent: I can help with that, but first I need your tail number to check the reservation." });
    await sleep(DELAY_MS);

    // 3. User: "It's ABC123." (+ Register Pilot Tool Call)
    // In real scenario, Agent calls tool. Here we simulate it.
    await sendWebhook({ text: "User: It's ABC123." });
    await sleep(500);
    await sendWebhook({
        type: 'tool_call',
        name: 'register_pilot', // Simulating the agent registering the pilot
        arguments: { tail_number: 'ABC123' }
    });
    await sleep(DELAY_MS);

    // 4. Agent: "Thank you. I don't see a reservation... What is your estimated landing time..."
    await sendWebhook({ text: "Agent: Thank you. I don't see a reservation under that tail number. what is your estimated landing time and location?" });
    await sleep(DELAY_MS);

    // 5. User: "Yeah, my estimated landing time is after 3 hours."
    await sendWebhook({ text: "User: Yeah, my estimated landing time is after 3 hours." });
    await sleep(DELAY_MS);

    // 6. Agent: "Thank you. Your reservation is confirmed. Do you need any services like fuel or car rental?"
    // Triggers "Reservation Agent" completion or activation? Screenshot shows "Reservation Agent" as complete/active.
    // Let's trigger a reservation agent check.
    await sendWebhook({ text: "Agent: Thank you. Your reservation is confirmed. Do you need any services like fuel or car rental?" });
    await sleep(500);
    await sendWebhook({
        type: 'tool_call',
        name: 'add_service',
        arguments: { service_type: 'reservation', details: 'Flight Reservation' }
    });
    await sleep(DELAY_MS);

    // 7. User: "Yeah, I need help with car rental."
    await sendWebhook({ text: "User: Yeah, I need help with car rental." });
    await sleep(DELAY_MS);

    // 8. Agent: "For car rental, what type and model would you prefer?"
    await sendWebhook({ text: "Agent: For car rental, what type and model would you prefer?" });
    await sleep(DELAY_MS);

    // 9. User: "I prefer 2025 BMW."
    await sendWebhook({ text: "User: I prefer 2025 BMW." });
    await sleep(500);
    // Trigger Car Rental
    await sendWebhook({
        type: 'tool_call',
        name: 'add_service',
        arguments: { service_type: 'car_rental', details: '2025 BMW' }
    });
    await sleep(DELAY_MS);

    // 10. Agent: "Perfect. Your 2025 BMW car rental is confirmed..."
    await sendWebhook({ text: "Agent: Perfect. Your 2025 BMW car rental is confirmed. Do you need any other services?" });

    // Add other agents from Screenshot to match the "5/5" look
    // Refueling: 30 liters of oil gas
    await sleep(1000);
    await sendWebhook({
        type: 'tool_call',
        name: 'add_service',
        arguments: { service_type: 'refueling', details: '30 liters of oil gas' }
    });

    // Catering: spicy chicken sandwiches
    await sleep(1000);
    await sendWebhook({
        type: 'tool_call',
        name: 'add_service',
        arguments: { service_type: 'catering', details: 'spicy chicken sandwiches' }
    });

    // Wine: 10 year old red
    await sleep(1000);
    await sendWebhook({
        type: 'tool_call',
        name: 'add_service',
        arguments: { service_type: 'wine', details: '10 year old red' }
    });

    console.log("Demo Simulation Complete.");
}

runDemo();

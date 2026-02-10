# Backend for Live Transcript Demo

This is a simple Node.js server that acts as a bridge between ElevenLabs/Twilio webhooks and the Frontend.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   node server.js
   ```
   The server will listen on port **3001**.
   - WebSocket: `ws://localhost:3001`
   - Webhook: `http://localhost:3001/webhook`

## Exposing to Internet

To receive webhooks from ElevenLabs or Twilio, your local server must be accessible from the internet. Use `ngrok`:

```bash
ngrok http 3001
```

Copy the HTTPS URL (e.g., `https://xxxx-xxxx.ngrok-free.app`) and configure it in your ElevenLabs agent settings or Twilio configuration as the **Webhook URL** (append `/webhook`).

Example Webhook URL: `https://xxxx-xxxx.ngrok-free.app/webhook`

## Usage

1. Start this backend server.
2. Start the frontend (`npm run dev` in the frontend directory).
3. In the frontend, go to an Order/Pilot detail view.
4. Click **Start Live Demo**.
   - The UI should show "Connected".
5. Make a call to the Twilio number associated with your ElevenLabs agent.
6. The transcript should appear in real-time in the frontend.

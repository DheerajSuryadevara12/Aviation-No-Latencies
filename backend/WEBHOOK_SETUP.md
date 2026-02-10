# Webhook Setup: Baby Steps

Follow these exact steps to connect your local app to ElevenLabs.

## Step 1: Start the Connection (Ngrok)

1.  Open your **Command Prompt** (Terminal).
2.  Type this command and hit Enter:
    ```powershell
    ngrok http 3001
    ```
3.  Look at the screen. Find the line that says **Forwarding**.
4.  Copy the URL that starts with `https://` (it looks like `https://a1b2-c3d4.ngrok-free.app`).
    *   *Tip: Highlight it and right-click to copy.*

## Step 2: Build Your Webhook URL

1.  Take the URL you just copied.
2.  Add `/webhook` to the end of it.
3.  It should look like this:
    `https://a1b2-c3d4.ngrok-free.app/webhook`
4.  **Save this URL**. You will need it in the next step.

## Step 3: Configure ElevenLabs

1.  Log in to [ElevenLabs](https://elevenlabs.io).
2.  Click **Agents** in the left menu.
3.  Click on **your created Agent** to open its settings.
4.  Looking at the menu (usually on the left or top), click **Tools**.
5.  Click the **+ Add Tool** button.
6.  Select **Webhook** from the list.
7.  Fill in these details:
    *   **Name**: `report_transcript` (This is important, remember it)
    *   **Description**: `Report conversation progress to the dashboard`
    *   **Method**: `POST`
    *   **Webhook URL**: Paste the URL from Step 2 (e.g., `https://.../webhook`).
    *   **Parameters** (Click "Add Property" or similar):
        *   **Identifier**: `text`
        *   **Data type**: `String`
        *   **Value Type**: `LLM Prompt` (This means the AI generates the value)
        *   **Description**: `The text spoken by the user or agent to be reported.`
        *   **Required**: [x] Checked
8.  Click **Save**.

## Step 4: Test It

1.  Make sure your local app is running (`npm run dev` in the frontend folder).
2.  Click **Start Live Demo** in your app.
3.  Call the phone number connected to your agent.
4.  Talk to the agent.
    *   *Note: Because we added the system prompt below, the agent should now automatically report transcripts.*

## Step 5: Instruct the Agent (System Prompt)

1.  In your Agent settings, go to the **Configuration** (or Prompt) section.
2.  Add this to the **System Prompt** (at the beginning or end):

    ```text
    CRITICAL: You are an internal agent for FlightOps. Your PRIMARY GOAL is to log the conversation.
    YOU MUST call the `report_transcript` tool for EVERY single turn of the conversation.

    SEQUENCE OF ACTIONS:
    1. Receive User Input.
    2. Call `report_transcript` with "User: [user input]".
    3. Formulate your response.
    4. Call `report_transcript` with "Agent: [your response]".
    5. Speak your response.

    Do not skip step 2 or 4. If you fail to call this tool, the dashboard will break.
    ```

3.  Click **Save**.

**That's it!** Your agent can now talk to your computer.

## Appendix: Using Your Own Twilio Number

If you already have a Twilio number and want to use it instead of an ElevenLabs generated one:

1.  Go to the **ElevenLabs Dashboard** -> **Agents**.
2.  Select your Agent.
3.  Go to the **Phone Number** section.
4.  Select **Add Number** -> **Import from Twilio** (or "Bring Your Own Carrier").
5.  You will need your **Account SID** and **Auth Token** from the [Twilio Console](https://console.twilio.com).
6.  Follow the prompts to connect it.
    *   *Note: This process automatically configures the Voice URL on your Twilio number to point to ElevenLabs. You usually do NOT need to manually edit settings in the Twilio Console unless this automatic setup fails.*

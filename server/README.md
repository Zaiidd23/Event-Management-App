# Event Manager Email Server

Backend server for sending email notifications when users register for events.

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Gmail SMTP

1. **Enable 2-Step Verification** on your Google Account:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password**:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Enter "Event Manager" as the name
   - Click "Generate"
   - Copy the 16-character password (you'll use this in `.env`)

3. **Create `.env` file**:
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file**:
   ```
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-character-app-password
   PORT=5000
   OPENAI_API_KEY=your-openai-api-key-here
   OPENAI_MODEL=gpt-3.5-turbo
   ```

   **Getting OpenAI API Key (for AI Chatbot):**
   - Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
   - Sign up or log in
   - Click "Create new secret key"
   - Copy and paste into `.env` file
   - Optional: Use `gpt-4` for better responses or `gpt-3.5-turbo` for faster/cheaper responses
   - **Note:** If `OPENAI_API_KEY` is not set, the chatbot will use a fallback rule-based system

### 3. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

**Run in background (Windows):**
```bash
# Double-click start-background.bat or run:
start-background.bat
```

**Using PM2 (Recommended for background):**
```bash
# Install PM2 globally (one-time)
npm install -g pm2

# Start server in background
npm run pm2:start

# View logs
npm run pm2:logs

# Stop server
npm run pm2:stop
```

The server will run on `http://localhost:5000`

> **💡 Don't want to keep a terminal open?** See [DEPLOYMENT_OPTIONS.md](./DEPLOYMENT_OPTIONS.md) for multiple ways to run the server in the background, including cloud deployment options!

## API Endpoints

### POST `/api/send-email`

Sends a registration confirmation email.

**Request Body:**
```json
{
  "to": "user@example.com",
  "eventTitle": "Event Name",
  "eventDate": "Monday, January 1, 2024 at 2:00 PM",
  "eventLocation": "Location Name",
  "eventDescription": "Event description",
  "userName": "User Name"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "email-message-id",
  "message": "Email sent successfully"
}
```

### POST `/api/chatbot`

AI-powered chatbot endpoint that uses OpenAI to generate intelligent responses about events.

**Request Body:**
```json
{
  "message": "What events are happening this week?",
  "events": [
    {
      "title": "Event Name",
      "startTime": "2024-01-15T10:00:00Z",
      "location": "Location",
      "category": "Sports",
      "description": "Event description",
      "registrations": ["user1", "user2"]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "response": "AI-generated response about events..."
}
```

**Note:** If OpenAI API key is not configured, returns `fallback: true` and the frontend will use the rule-based system.

### GET `/api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Email server is running",
  "aiEnabled": true
}
```

## Notes

- The server uses Gmail SMTP service for email notifications
- Make sure to use an **App Password**, not your regular Gmail password
- The email service runs independently and won't block the main application if it fails
- Email sending errors are logged but don't affect the registration process
- **AI Chatbot:** Requires OpenAI API key. If not configured, the chatbot uses a fallback rule-based system
- The chatbot endpoint receives event data from the frontend to provide context-aware responses



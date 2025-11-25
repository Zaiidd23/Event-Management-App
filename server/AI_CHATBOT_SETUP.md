# AI Chatbot Setup Guide

Your chatbot is now powered by OpenAI (ChatGPT)! 🚀

## Quick Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

This will install the `openai` package automatically.

### 2. Get OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign up or log in to your OpenAI account
3. Click **"Create new secret key"**
4. Copy the API key (it starts with `sk-`)

### 3. Add to .env File

Add these lines to your `server/.env` file:

```env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
```

**Model Options:**
- `gpt-3.5-turbo` - Fast and cost-effective (recommended)
- `gpt-4` - More intelligent but slower and more expensive
- `gpt-4-turbo` - Best balance of speed and intelligence

### 4. Restart Your Server

```bash
# If using npm start
npm start

# If using PM2
npm run pm2:restart
```

## How It Works

1. **AI-Powered Responses**: The chatbot uses ChatGPT to understand user questions and provide intelligent, contextual responses
2. **Event Context**: The AI receives information about all your events, so it can answer questions about specific events, dates, locations, etc.
3. **Automatic Fallback**: If the API key is not set or the API fails, the chatbot automatically falls back to the rule-based system

## Testing

1. Open your app and click the chatbot button
2. Try asking:
   - "What events are happening this week?"
   - "Tell me about sports events"
   - "Suggest some event ideas"
   - "How many people registered for [event name]?"

## Cost Information

- **GPT-3.5-turbo**: ~$0.002 per 1K tokens (very cheap)
- **GPT-4**: ~$0.03 per 1K tokens (more expensive)
- Average conversation: ~500-1000 tokens
- **Estimated cost**: $0.001-0.003 per conversation with GPT-3.5-turbo

OpenAI offers free credits for new accounts, so you can test it out!

## Troubleshooting

### Chatbot not responding with AI?

1. Check that `OPENAI_API_KEY` is set in your `.env` file
2. Verify the server restarted after adding the key
3. Check server logs for errors
4. The chatbot will automatically use the fallback system if AI is unavailable

### API Key Invalid?

- Make sure you copied the entire key (starts with `sk-`)
- Check for extra spaces in your `.env` file
- Regenerate the key if needed

### Rate Limits?

- OpenAI has rate limits based on your account tier
- Free tier: 3 requests per minute
- Paid tier: Higher limits
- The fallback system will handle rate limit errors gracefully

## Security Note

⚠️ **Never commit your `.env` file to Git!** It contains sensitive API keys.

Your `.env` file should already be in `.gitignore`, but double-check to be safe.


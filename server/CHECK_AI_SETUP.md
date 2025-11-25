# Quick AI Setup Check

## Step 1: Check if Server is Running

Open your browser and go to:
```
http://localhost:5000/api/health
```

You should see:
```json
{
  "status": "ok",
  "message": "Email server is running",
  "aiEnabled": true,
  "openaiConfigured": true,
  "model": "gpt-3.5-turbo"
}
```

**If `aiEnabled` is `false`**, the API key is not set or not loaded.

## Step 2: Check Chatbot Test Endpoint

Go to:
```
http://localhost:5000/api/chatbot/test
```

This will tell you exactly what's wrong:
- ✅ If OpenAI is configured properly
- ⚠️ If the API key is missing
- ⚠️ If the API key is invalid

## Step 3: Check Your .env File

Make sure your `server/.env` file has:
```env
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL=gpt-3.5-turbo
```

**Important:**
- The API key should start with `sk-`
- No quotes around the key
- No spaces before or after the `=`
- Make sure the file is named `.env` (not `.env.txt`)

## Step 4: Restart Your Server

After adding/changing the API key:
1. Stop your server (Ctrl+C)
2. Start it again: `npm start` or `npm run dev`

## Step 5: Check Browser Console

1. Open your React app
2. Open browser DevTools (F12)
3. Go to Console tab
4. Ask the chatbot a question
5. Look for these logs:
   - `🤖 Calling chatbot API:` - Shows the API is being called
   - `📡 API Response status:` - Shows the HTTP status
   - `📦 API Response data:` - Shows the response
   - `✅ Using AI response` - AI is working!
   - `🔄 Using fallback response system` - AI failed, using fallback

## Step 6: Check Server Console

Look at your server terminal for:
- `✅ OpenAI client initialized` - Good!
- `⚠️ OpenAI API key not found` - Bad! Check .env file
- `🤖 Chatbot request received` - Request is coming through
- `📤 Calling OpenAI API...` - API call is being made
- `✅ Chatbot response generated successfully` - Success!

## Common Issues

### Issue: "AI service not configured"
**Solution:** Add `OPENAI_API_KEY` to your `.env` file and restart server

### Issue: "Failed to generate response"
**Possible causes:**
- Invalid API key
- No internet connection
- OpenAI API is down
- Rate limit exceeded (free tier: 3 requests/minute)

### Issue: Still getting fallback responses
**Check:**
1. Is the server running? (http://localhost:5000/api/health)
2. Is the API key in `.env`?
3. Did you restart the server after adding the key?
4. Check browser console for error messages
5. Check server console for error messages

## Quick Test

Ask the chatbot: **"What's 5 times 7?"**

- **AI Response:** "35" or "5 times 7 equals 35"
- **Fallback Response:** Generic Acadia Hub message about events

If you get the fallback, check the steps above!


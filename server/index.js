const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS configuration
// In production, allow all origins (or specify your frontend domain)
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? true // Allow all origins in production (or specify: ['https://your-app.vercel.app', 'https://your-app.netlify.app'])
  : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD // Use App Password, not regular password
  }
});

// Initialize OpenAI client (optional - only if API key is provided)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('✅ OpenAI client initialized');
} else {
  console.warn('⚠️ OpenAI API key not found. Chatbot will use fallback responses.');
}

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, eventTitle, eventDate, eventLocation, eventDescription, userName } = req.body;

    if (!to || !eventTitle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Email content
    const mailOptions = {
      from: `"Acadia Hub" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: `Registration Confirmation: ${eventTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .event-card {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #6366f1;
            }
            .event-detail {
              margin: 10px 0;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .event-detail:last-child {
              border-bottom: none;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6b7280;
              font-size: 12px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #6366f1;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Registration Confirmed!</h1>
            <p>You're all set for this event</p>
          </div>
          <div class="content">
            <p>Hi ${userName || 'there'},</p>
            <p>Great news! You've successfully registered for the following event:</p>
            
            <div class="event-card">
              <h2 style="margin-top: 0; color: #6366f1;">${eventTitle}</h2>
              
              ${eventDate ? `
              <div class="event-detail">
                <strong>📅 Date & Time:</strong> ${eventDate}
              </div>
              ` : ''}
              
              ${eventLocation ? `
              <div class="event-detail">
                <strong>📍 Location:</strong> ${eventLocation}
              </div>
              ` : ''}
              
              ${eventDescription ? `
              <div class="event-detail">
                <strong>📝 Description:</strong><br>
                ${eventDescription}
              </div>
              ` : ''}
            </div>
            
            <p>We're excited to have you join us! Make sure to mark your calendar and we'll see you there.</p>
            
            <p>If you have any questions or need to make changes to your registration, please contact the event organizer.</p>
            
            <div class="footer">
              <p>Best regards,<br>The Acadia Hub Team</p>
              <p style="margin-top: 20px; font-size: 11px;">
                This is an automated email. Please do not reply to this message.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Registration Confirmation: ${eventTitle}
        
        Hi ${userName || 'there'},
        
        You've successfully registered for: ${eventTitle}
        
        ${eventDate ? `Date & Time: ${eventDate}` : ''}
        ${eventLocation ? `Location: ${eventLocation}` : ''}
        
        We're excited to have you join us!
        
        Best regards,
        The Acadia Hub Team
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', info.messageId);
    res.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email sent successfully' 
    });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send email' 
    });
  }
});

// Root endpoint - Server information
app.get('/', (req, res) => {
  res.json({
    service: 'Event Manager Email Server',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      sendEmail: 'POST /api/send-email',
      chatbot: 'POST /api/chatbot'
    },
    message: 'Email server is running. Use the React app at http://localhost:3000'
  });
});

// Chatbot endpoint - AI-powered responses with event context
app.post('/api/chatbot', async (req, res) => {
  try {
    const { message, events = [] } = req.body;

    console.log('🤖 Chatbot request received:', { 
      messageLength: message?.length, 
      eventsCount: events?.length,
      hasOpenAI: !!openai 
    });

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // If OpenAI is not configured, return a helpful error
    if (!openai) {
      console.warn('⚠️ OpenAI not configured - returning fallback signal');
      return res.status(503).json({ 
        error: 'AI service not configured',
        message: 'Please add OPENAI_API_KEY to your .env file',
        fallback: true
      });
    }

    // Prepare event context for the AI
    const eventContext = events.length > 0 ? events.map(event => {
      const eventDate = new Date(event.startTime);
      const isUpcoming = eventDate >= new Date();
      return {
        title: event.title,
        date: eventDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        location: event.location,
        category: event.category,
        description: event.description || '',
        registrations: event.registrations?.length || 0,
        isUpcoming: isUpcoming
      };
    }).slice(0, 20) : []; // Limit to 20 events to avoid token limits

    // Create a system prompt with event context
    const systemPrompt = `You are a helpful assistant for Acadia Hub, an event management platform for students. 
Your role is to help users find events, answer questions about events, suggest event ideas, and provide general assistance.

${eventContext.length > 0 ? `
Current Events in the System:
${eventContext.map((e, i) => `${i + 1}. ${e.title} - ${e.date} at ${e.location} (${e.category}, ${e.registrations} registrations)${e.description ? ` - ${e.description.substring(0, 100)}` : ''}`).join('\n')}
` : 'There are currently no events in the system.'}

Guidelines:
- Be friendly, helpful, and conversational
- When users ask about events, use the event data provided above
- If asked about specific event details, provide accurate information from the event list
- Suggest relevant events based on user interests
- Help users understand how to use Acadia Hub
- If you don't have information about something, say so honestly
- Keep responses concise but informative
- Use emojis sparingly and appropriately`;

    // Call OpenAI API
    console.log('📤 Calling OpenAI API...');
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

    console.log('✅ Chatbot response generated successfully');
    console.log('📝 Response preview:', aiResponse.substring(0, 100) + '...');
    res.json({ 
      success: true, 
      response: aiResponse 
    });
  } catch (error) {
    console.error('❌ Error in chatbot endpoint:', error);
    console.error('❌ Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type
    });
    
    // Return a user-friendly error with fallback flag
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to generate response',
      fallback: true
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Email server is running',
    aiEnabled: !!openai,
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
  });
});

// Chatbot test endpoint - for debugging
app.get('/api/chatbot/test', (req, res) => {
  res.json({
    status: 'ok',
    openaiInitialized: !!openai,
    openaiApiKeySet: !!process.env.OPENAI_API_KEY,
    apiKeyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    message: openai 
      ? '✅ OpenAI is properly configured and ready!' 
      : '⚠️ OpenAI is not configured. Add OPENAI_API_KEY to .env file'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Email server running on port ${PORT}`);
  console.log(`📧 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Server info: http://localhost:${PORT}/`);
});


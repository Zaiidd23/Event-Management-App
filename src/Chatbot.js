import React, { useEffect, useRef, useState } from 'react';

const Chatbot = ({ isOpen, onClose, events = [] }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your Acadia Hub assistant. I can help you find events, suggest new event ideas, answer questions about what's happening on campus, and assist with anything related to Acadia Hub. What would you like to know?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const getIntelligentResponse = (userMessage) => {
    const message = userMessage.toLowerCase();

    // Event-related queries
    if (message.includes('event') || message.includes('events')) {
      if (message.includes('upcoming') || message.includes('today') || message.includes('this week')) {
        const upcomingEvents = events.filter(event => new Date(event.startTime) >= new Date());
        if (upcomingEvents.length > 0) {
          const eventList = upcomingEvents.slice(0, 3).map(event =>
            `• ${event.title} on ${new Date(event.startTime).toLocaleDateString()} at ${event.location}`
          ).join('\n');
          return `Here are the upcoming events:\n\n${eventList}\n\n${upcomingEvents.length > 3 ? `...and ${upcomingEvents.length - 3} more events!` : ''}`;
        } else {
          return "I don't see any upcoming events at the moment. Check back later for new events!";
        }
      }

      if (message.includes('sports') || message.includes('sport')) {
        const sportsEvents = events.filter(event =>
          event.category === 'Sports' && new Date(event.startTime) >= new Date()
        );
        if (sportsEvents.length > 0) {
          return `I found ${sportsEvents.length} upcoming sports event${sportsEvents.length > 1 ? 's' : ''}:\n\n${sportsEvents.map(event =>
            `• ${event.title} - ${new Date(event.startTime).toLocaleDateString()} at ${event.location}`
          ).join('\n')}`;
        } else {
          return "No upcoming sports events found. Check back later!";
        }
      }

      if (message.includes('workshop') || message.includes('workshops')) {
        const workshops = events.filter(event =>
          event.category === 'Workshop' && new Date(event.startTime) >= new Date()
        );
        if (workshops.length > 0) {
          return `I found ${workshops.length} upcoming workshop${workshops.length > 1 ? 's' : ''}:\n\n${workshops.map(event =>
            `• ${event.title} - ${new Date(event.startTime).toLocaleDateString()} at ${event.location}`
          ).join('\n')}`;
        } else {
          return "No upcoming workshops found. Check back later!";
        }
      }

      if (message.includes('club') || message.includes('clubs')) {
        const clubEvents = events.filter(event =>
          event.category === 'Club' && new Date(event.startTime) >= new Date()
        );
        if (clubEvents.length > 0) {
          return `I found ${clubEvents.length} upcoming club event${clubEvents.length > 1 ? 's' : ''}:\n\n${clubEvents.map(event =>
            `• ${event.title} - ${new Date(event.startTime).toLocaleDateString()} at ${event.location}`
          ).join('\n')}`;
        } else {
          return "No upcoming club events found. Check back later!";
        }
      }

      if (message.includes('how many') || message.includes('count') || message.includes('total')) {
        const totalEvents = events.length;
        const upcomingEvents = events.filter(event => new Date(event.startTime) >= new Date()).length;
        return `There are currently ${totalEvents} total events in the system, with ${upcomingEvents} upcoming events.`;
      }
    }

    // Event suggestion queries
    if (message.includes('suggest') || message.includes('idea') || message.includes('recommend') || message.includes('what event') || message.includes('create event')) {
      const categories = ['Sports', 'Workshop', 'Club', 'Social', 'Academic'];
      const existingCategories = [...new Set(events.map(e => e.category))];
      const suggestions = [];
      
      // Analyze what types of events are popular
      const categoryCounts = {};
      events.forEach(event => {
        categoryCounts[event.category] = (categoryCounts[event.category] || 0) + 1;
      });
      
      // Suggest events for underrepresented categories
      categories.forEach(cat => {
        if (!existingCategories.includes(cat) || categoryCounts[cat] < 2) {
          suggestions.push(`• A ${cat} event could attract more participation!`);
        }
      });
      
      // Provide specific suggestions
      const eventSuggestions = [
        '\n🎯 Specific Event Ideas:\n',
        '• Fitness Workshop - "Get Fit Friday" with yoga or HIIT sessions',
        '• Tech Workshop - "Intro to Web Development" or "Python Basics"',
        '• Social Mixer - Speed networking or coffee meetup',
        '• Study Group - "Study Hall Sundays" for collaborative learning',
        '• Club Showcase - Introduce new members to all campus clubs',
        '• Mental Health Workshop - Stress management and mindfulness',
        '• Career Fair Prep - Resume building and interview tips',
        '• Movie Night - Outdoor screening or themed movie marathon',
        '• Food Festival - Cultural food tasting from different clubs'
      ];
      
      return `📋 **Event Suggestions for Acadia Hub:**\n\n${suggestions.length > 0 ? suggestions.join('\n') + '\n\n' : ''}${eventSuggestions.join('\n')}\n\n💡 **Tips:**\n• Events with clear benefits attract more students\n• Include interactive activities\n• Schedule during high-traffic times (12-2pm or evenings)\n• Set reasonable max registrations (20-50 people)`;
    }

    // Help queries
    if (message.includes('help') || message.includes('what can you do')) {
      return `I can help you with:\n\n• Find upcoming events\n• Search events by category (sports, workshops, clubs)\n• Get event details and locations\n• Suggest new event ideas\n• Tell you how many events are available\n• Answer questions about Acadia Hub\n\nJust ask me about events or anything else!`;
    }

    // Greeting responses
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return `Hello! I'm your Acadia Hub assistant. I can help you find events, answer questions about what's happening on campus, and assist with anything related to Acadia Hub. What would you like to know?`;
    }

    // Default responses
    const defaultResponses = [
      "I'm here to help with Acadia Hub! You can ask me about events, categories, or anything else related to the platform.",
      "That's a great question! I can help you find events or answer questions about Acadia Hub.",
      "I'd be happy to help! Try asking me about upcoming events or specific categories like sports or workshops.",
      "I'm your Acadia Hub assistant! I can help you discover events and answer questions about what's happening on campus."
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: getIntelligentResponse(messageToSend),
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '350px',
          height: '500px',
          maxHeight: '80vh',
          background: 'var(--gradient-card)',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-2xl)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid var(--border-primary)',
          background: 'var(--gradient-primary)',
          color: 'var(--text-inverse)',
          borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
              }}>
                🤖
              </div>
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  margin: 0,
                }}>
                  Acadia Hub Assistant
                </h3>
                <p style={{
                  fontSize: '12px',
                  margin: 0,
                  opacity: 0.8,
                }}>
                  Online • Ready to help
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="btn btn-ghost"
              style={{
                width: '28px',
                height: '28px',
                padding: 0,
                borderRadius: '50%',
                color: 'var(--text-inverse)',
                background: 'rgba(255, 255, 255, 0.1)',
                fontSize: '14px',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          padding: '1rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{ display: 'flex', justifyContent: message.isBot ? 'flex-start' : 'flex-end' }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '0.75rem 1rem',
                  borderRadius: message.isBot 
                    ? 'var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm)'
                    : 'var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-xl)',
                  background: message.isBot 
                    ? 'var(--bg-tertiary)' 
                    : 'var(--gradient-primary)',
                  color: message.isBot 
                    ? 'var(--text-primary)' 
                    : 'var(--text-inverse)',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-line',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {message.text}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm)',
                color: 'var(--text-muted)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    background: 'var(--text-muted)',
                    borderRadius: '50%',
                    animation: 'bounce 1.4s ease-in-out infinite both',
                  }} />
                  <div style={{
                    width: '6px',
                    height: '6px',
                    background: 'var(--text-muted)',
                    borderRadius: '50%',
                    animation: 'bounce 1.4s ease-in-out infinite both',
                    animationDelay: '0.16s',
                  }} />
                  <div style={{
                    width: '6px',
                    height: '6px',
                    background: 'var(--text-muted)',
                    borderRadius: '50%',
                    animation: 'bounce 1.4s ease-in-out infinite both',
                    animationDelay: '0.32s',
                  }} />
                </div>
                <span>Assistant is typing...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid var(--border-primary)',
          background: 'var(--bg-secondary)',
        }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="input"
              style={{
                flex: 1,
                fontSize: '14px',
                padding: '0.75rem',
                marginBottom: 0,
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!inputMessage.trim()}
              style={{
                padding: '0.75rem',
                minWidth: '40px',
                height: '40px',
              }}
            >
              <span style={{ fontSize: '16px' }}>🚀</span>
            </button>
          </form>
          
          <p style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: '0.5rem',
            marginBottom: 0,
          }}>
            Try: "suggest events", "what events are happening?", or "help me plan an event"
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
import { signOut } from 'firebase/auth';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import Chatbot from './Chatbot';
import { auth, db } from './firebase';
import { useTheme } from './ThemeContext';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [editEvent, setEditEvent] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [registrantsModalOpen, setRegistrantsModalOpen] = useState(false);
  const [selectedEventRegistrants, setSelectedEventRegistrants] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
  const [unregisterModalOpen, setUnregisterModalOpen] = useState(false);
  const [eventToUnregister, setEventToUnregister] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [userNames, setUserNames] = useState({});
  const { isDarkMode, toggleTheme } = useTheme();

  const user = auth.currentUser;

  // Test Firebase connection
  useEffect(() => {
    console.log('🔌 Testing Firebase connection...');
    console.log('📦 Database:', db);
    console.log('👤 Auth:', auth);
    console.log('👤 Current user:', user);
    
    // Test if we can access the collection
    try {
      const testRef = collection(db, 'events');
      console.log('✅ Collection reference created:', testRef);
    } catch (error) {
      console.error('❌ Failed to create collection reference:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef).then((doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
        }
        setUserDataLoading(false);
      }).catch((error) => {
        console.error('Error fetching user data:', error);
        setUserDataLoading(false);
      });
    } else {
      setUserDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    console.log('🔍 Setting up Firebase events listener...');
    console.log('📊 Database instance:', db);
    
    // Try simple query first without orderBy
    const eventsRef = collection(db, 'events');
    console.log('📋 Events collection reference:', eventsRef);
    
    const unsubscribe = onSnapshot(
      eventsRef,
      (snapshot) => {
        console.log('📥 Snapshot received:', snapshot);
        console.log('📊 Snapshot size:', snapshot.size);
        console.log('📊 Snapshot empty:', snapshot.empty);
        
        if (snapshot.empty) {
          console.warn('⚠️ No events found in Firestore');
          setEvents([]);
          return;
        }

        const eventsData = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('📄 Event doc:', doc.id, data);
          return {
            id: doc.id,
            ...data
          };
        });
        
        // Sort manually by createdAt if available
        const sortedEvents = eventsData.sort((a, b) => {
          try {
            if (a.createdAt && b.createdAt) {
              const aTime = a.createdAt.toMillis ? a.createdAt.toMillis() : 
                           (a.createdAt.toDate ? a.createdAt.toDate().getTime() : 
                           new Date(a.createdAt).getTime());
              const bTime = b.createdAt.toMillis ? b.createdAt.toMillis() : 
                           (b.createdAt.toDate ? b.createdAt.toDate().getTime() : 
                           new Date(b.createdAt).getTime());
              return bTime - aTime;
            }
          } catch (e) {
            console.warn('Error sorting event:', e);
          }
          return 0;
        });
        
        console.log('✅ Events loaded successfully:', sortedEvents.length);
        console.log('📋 Events data:', sortedEvents);
        setEvents(sortedEvents);
      },
      (error) => {
        console.error('❌ Error fetching events:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        setEvents([]);
      }
    );

    return () => {
      console.log('🧹 Cleaning up events listener');
      unsubscribe();
    };
  }, []);

  // Preload user names for all registrations
  useEffect(() => {
    const loadUserNames = async () => {
      const allUserIds = new Set();
      events.forEach(event => {
        if (event.registrations) {
          event.registrations.forEach(userId => allUserIds.add(userId));
        }
      });

      console.log('Loading names for user IDs:', Array.from(allUserIds));

      const promises = Array.from(allUserIds).map(async (userId) => {
        try {
          const userDocRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userName = userData.name || userData.email;
            console.log(`Loaded name for ${userId}:`, userName);
            return { userId, userName };
          } else {
            console.log(`User document not found for: ${userId}`);
          }
        } catch (error) {
          console.error('Error fetching user name:', error);
        }
        return null;
      });

      const results = await Promise.all(promises);
      const newUserNames = {};
      results.forEach(result => {
        if (result) {
          newUserNames[result.userId] = result.userName;
        }
      });

      console.log('Final userNames object:', newUserNames);

      if (Object.keys(newUserNames).length > 0) {
        setUserNames(prev => ({ ...prev, ...newUserNames }));
      }
    };

    if (events.length > 0) {
      loadUserNames();
    }
  }, [events]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownOpen && !event.target.closest('[data-profile-dropdown]')) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [profileDropdownOpen]);

  // Function to get user name from user ID
  const getUserName = async (userId) => {
    if (userNames[userId]) {
      return userNames[userId];
    }
    
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userName = userDoc.data().name || userDoc.data().email;
        setUserNames(prev => ({ ...prev, [userId]: userName }));
        return userName;
      }
      return userId; // fallback to user ID if name not found
    } catch (error) {
      console.error('Error fetching user name:', error);
      return userId; // fallback to user ID
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const eventData = {
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      location: formData.get('location'),
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      maxRegistrations: parseInt(formData.get('maxRegistrations')),
      registrations: [],
      comments: [],
      createdBy: user.uid,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'events'), eventData);
      e.target.reset();
      setCreateEventModalOpen(false);
      showNotification('Event created successfully!');
    } catch (error) {
      showNotification('Error creating event: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId, isRegistered) => {
    const eventRef = doc(db, 'events', eventId);
    try {
      if (isRegistered) {
        // Show confirmation modal instead of immediately unregistering
        const event = events.find(e => e.id === eventId);
        setEventToUnregister({ id: eventId, title: event?.title || 'this event' });
        setUnregisterModalOpen(true);
        return;
      } else {
        await updateDoc(eventRef, {
          registrations: arrayUnion(user.uid)
        });
        showNotification('Registered for event');
        
        // Send confirmation email
        try {
          const eventDoc = await getDoc(eventRef);
          const eventData = eventDoc.data();
          
          if (eventData && user.email) {
            const eventDate = eventData.startTime 
              ? new Date(eventData.startTime).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })
              : null;
            
            const apiUrl = process.env.REACT_APP_EMAIL_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/api/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: user.email,
                eventTitle: eventData.title,
                eventDate: eventDate,
                eventLocation: eventData.location,
                eventDescription: eventData.description,
                userName: userData?.name || user.email
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              if (result.success) {
                console.log('✅ Confirmation email sent successfully');
              } else {
                console.warn('⚠️ Email sending failed:', result.error);
              }
            } else {
              console.warn('⚠️ Email server responded with error:', response.status);
            }
          }
        } catch (emailError) {
          // Don't show error to user if email fails, just log it
          // This ensures registration still works even if email server is down
          console.error('Email sending error (non-blocking):', emailError);
        }
      }
    } catch (error) {
      showNotification('Error updating registration: ' + error.message, 'error');
    }
  };

  const handleConfirmUnregister = async () => {
    if (!eventToUnregister) return;
    
    const eventRef = doc(db, 'events', eventToUnregister.id);
    try {
      await updateDoc(eventRef, {
        registrations: arrayRemove(user.uid)
      });
      showNotification('Unregistered from event');
      setUnregisterModalOpen(false);
      setEventToUnregister(null);
    } catch (error) {
      showNotification('Error unregistering: ' + error.message, 'error');
      setUnregisterModalOpen(false);
      setEventToUnregister(null);
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteDoc(doc(db, 'events', eventId));
        showNotification('Event deleted successfully');
      } catch (error) {
        showNotification('Error deleting event: ' + error.message, 'error');
      }
    }
  };

  const handleEdit = (event) => {
    setEditEvent(event);
    setEditOpen(true);
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const eventData = {
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      location: formData.get('location'),
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      maxRegistrations: parseInt(formData.get('maxRegistrations'))
    };

    try {
      await updateDoc(doc(db, 'events', editEvent.id), eventData);
      setEditOpen(false);
      setEditEvent(null);
      showNotification('Event updated successfully!');
    } catch (error) {
      showNotification('Error updating event: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async (eventId, comment) => {
    if (!user || !userData) {
      showNotification('Please wait for authentication to complete', 'error');
      return;
    }

    const eventRef = doc(db, 'events', eventId);
    try {
      const eventDoc = await getDoc(eventRef);
      const currentComments = eventDoc.data()?.comments || [];
      
      const newComment = {
        text: comment,
        author: userData.name || user.email || 'Anonymous',
        authorId: user.uid,
        timestamp: new Date().toISOString()
      };
      
      await updateDoc(eventRef, {
        comments: [...currentComments, newComment]
      });
      
      showNotification('Comment added successfully!');
    } catch (error) {
      console.error('Comment error:', error);
      showNotification('Error adding comment: ' + error.message, 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      showNotification('Error signing out: ' + error.message, 'error');
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || event.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return bTime - aTime;
      case 'oldest':
        const aTimeOld = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const bTimeOld = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return aTimeOld - bTimeOld;
      default:
        return 0;
    }
  });

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--gradient-bg)',
      color: 'var(--text-primary)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decorations */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)',
        animation: 'float 20s ease-in-out infinite',
        zIndex: 0,
      }} />
      
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '10%',
        width: '300px',
        height: '300px',
        background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
        borderRadius: '50%',
        filter: 'blur(100px)',
        animation: 'float 15s ease-in-out infinite reverse',
        zIndex: 0,
      }} />

      <div className="container" style={{ 
        position: 'relative', 
        zIndex: 1,
        padding: '24px 20px',
        paddingBottom: '40px',
      }}>
      {/* Main Header with Acadia Hub */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto 40px auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "20px",
      }}>
        <div style={{
          maxWidth: "600px",
          margin: "0 auto 0 0",
        }}>
          <h1 style={{ 
            margin: 0, 
            fontFamily: "'Poppins', 'Inter', sans-serif",
            fontWeight: 900, 
            letterSpacing: "-0.05em",
            fontSize: "52px",
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 30%, #7c3aed 60%, #a855f7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: "1.1",
            textShadow: "0 0 40px rgba(99, 102, 241, 0.3)",
            filter: "drop-shadow(0 2px 4px rgba(99, 102, 241, 0.2))",
            position: "relative",
          }}>
            Acadia Hub
          </h1>
        </div>
        
        {/* Action Buttons - Right Corner */}
        <div style={{ 
          display: "flex", 
          gap: "12px", 
          alignItems: "center", 
          position: "relative",
          marginRight: "20px",
        }}>
          <button
            onClick={toggleTheme}
            style={{
              background: "var(--bg-tertiary)",
              border: "1.5px solid var(--border-primary)",
              borderRadius: "var(--radius-lg)",
              padding: "12px",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontSize: "16px",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            onMouseEnter={(e) => {
              e.target.style.background = "var(--bg-secondary)";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "var(--bg-tertiary)";
              e.target.style.transform = "translateY(0)";
            }}
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>
          
          {/* Profile Dropdown */}
          <div style={{ position: "relative" }} data-profile-dropdown>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              style={{
                background: "var(--gradient-primary)",
                color: "var(--text-inverse)",
                border: "none",
                borderRadius: "var(--radius-lg)",
                padding: "10px 18px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "var(--shadow-md)",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "var(--shadow-lg)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "var(--shadow-md)";
              }}
            >
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "14px",
                border: "2px solid rgba(255, 255, 255, 0.3)",
              }}>
                {(userData?.name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span>{userData?.name || user.email}</span>
              <span style={{ fontSize: "10px", marginLeft: "4px" }}>{profileDropdownOpen ? '▲' : '▼'}</span>
            </button>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                background: "var(--bg-modal)",
                borderRadius: "var(--radius-xl)",
                boxShadow: "var(--shadow-2xl)",
                border: "1.5px solid var(--border-primary)",
                minWidth: "340px",
                maxWidth: "400px",
                zIndex: 1000,
                overflow: "hidden",
                animation: "modalSlideIn 0.2s ease-out",
                backdropFilter: "blur(10px)",
              }}>
                <div style={{ padding: "24px" }}>
                  <h3 style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "var(--text-primary)",
                    marginBottom: "20px",
                    letterSpacing: "-0.02em",
                  }}>
                    Profile Information
                  </h3>
                  
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                      color: "var(--text-muted)",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      Name
                    </label>
                    <input
                      type="text"
                      value={userData?.name || ''}
                      className="input"
                      disabled
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                      color: "var(--text-muted)",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      Role
                    </label>
                    <input
                      type="text"
                      value={userData?.role || ''}
                      className="input"
                      disabled
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: "24px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                      color: "var(--text-muted)",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      className="input"
                      disabled
                      style={{ marginBottom: 0 }}
                    />
                  </div>

                  {/* Events Created by Club User */}
                  {userData && (userData.role === 'Club/Society' || userData.role === 'club') && (
                    <div style={{ marginBottom: "24px" }}>
                      <label style={{
                        display: "block",
                        marginBottom: "12px",
                        fontWeight: "600",
                        color: "var(--text-primary)",
                        fontSize: "14px",
                      }}>
                        Events Created ({events.filter(e => e.createdBy === user.uid).length})
                      </label>
                      <div style={{
                        maxHeight: "200px",
                        overflowY: "auto",
                        border: "1px solid var(--border-primary)",
                        borderRadius: "var(--radius-lg)",
                        padding: "12px",
                        background: "var(--bg-tertiary)",
                      }}>
                        {events.filter(e => e.createdBy === user.uid).length > 0 ? (
                          events
                            .filter(e => e.createdBy === user.uid)
                            .map((event) => (
                              <div
                                key={event.id}
                                style={{
                                  padding: "10px",
                                  marginBottom: "6px",
                                  background: "var(--gradient-card)",
                                  borderRadius: "var(--radius-md)",
                                  border: "1px solid var(--border-primary)",
                                }}
                              >
                                <div style={{
                                  fontWeight: "600",
                                  color: "var(--text-primary)",
                                  marginBottom: "4px",
                                  fontSize: "13px",
                                }}>
                                  {event.title}
                                </div>
                                <div style={{
                                  display: "flex",
                                  gap: "10px",
                                  flexWrap: "wrap",
                                  fontSize: "11px",
                                  color: "var(--text-secondary)",
                                }}>
                                  <span>📍 {event.location}</span>
                                  <span>📅 {new Date(event.startTime).toLocaleDateString()}</span>
                                  <span>👥 {event.registrations?.length || 0}/{event.maxRegistrations}</span>
                                </div>
                              </div>
                            ))
                        ) : (
                          <div style={{
                            textAlign: "center",
                            padding: "16px",
                            color: "var(--text-muted)",
                            fontSize: "13px",
                            fontStyle: "italic",
                          }}>
                            No events created yet
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="btn btn-danger"
                    style={{
                      width: "100%",
                      fontSize: "14px",
                      padding: "12px 20px",
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Create Event Button - Only for Club/Society */}
        {!userDataLoading && userData && (userData.role === 'Club/Society' || userData.role === 'club') && (
          <div style={{ 
            marginBottom: "32px", 
            display: "flex", 
            justifyContent: "flex-end",
            maxWidth: "1200px",
            margin: "0 auto 32px auto",
            paddingRight: "20px",
          }}>
            <button
              onClick={() => setCreateEventModalOpen(true)}
              className="btn btn-primary"
              style={{
                fontSize: "16px",
                padding: "14px 32px",
                fontWeight: "600",
                letterSpacing: "-0.01em",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <span style={{ fontSize: "20px" }}>✨</span>
              Create New Event
            </button>
          </div>
        )}

        {/* Main Content with Sidebar */}
        <div style={{ 
          display: "flex",
          gap: "24px",
          maxWidth: "1200px",
          margin: "0 auto",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}>
          {/* Main Feed */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Category Quick Filters */}
            <div style={{ 
              maxWidth: "600px",
              margin: "0 auto 20px auto",
            }}>
              <div style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                alignItems: "center",
              }}>
                <span style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--text-muted)",
                  marginRight: "4px",
                }}>Filter:</span>
                {['All', 'Sports', 'Workshop', 'Club', 'Social', 'Academic'].map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "var(--radius-full)",
                      border: categoryFilter === category ? "2px solid transparent" : "1.5px solid var(--border-primary)",
                      background: categoryFilter === category 
                        ? "var(--gradient-primary)" 
                        : "var(--bg-tertiary)",
                      color: categoryFilter === category 
                        ? "var(--text-inverse)" 
                        : "var(--text-primary)",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      if (categoryFilter !== category) {
                        e.target.style.background = "var(--bg-secondary)";
                        e.target.style.transform = "translateY(-2px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (categoryFilter !== category) {
                        e.target.style.background = "var(--bg-tertiary)";
                        e.target.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div style={{ 
              maxWidth: "600px",
              margin: "0 auto 32px auto",
            }}>
              <div className="card" style={{ 
                padding: "20px",
                background: "var(--gradient-card)",
                border: "1px solid var(--border-primary)",
                borderRadius: "var(--radius-xl)",
              }}>
                <div style={{ 
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}>
                  <div style={{ flex: "1", minWidth: "180px" }}>
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input"
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  <div style={{ minWidth: "140px" }}>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="select"
                      style={{ marginBottom: 0 }}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Events Feed */}
            <div style={{ 
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              maxWidth: "600px",
              margin: "0 auto",
            }}>
              {sortedEvents.length === 0 ? (
                <div className="card" style={{
                  padding: "48px 32px",
                  textAlign: "center",
                  background: "var(--gradient-card)",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "var(--radius-xl)",
                }}>
                  <div style={{
                    fontSize: "64px",
                    marginBottom: "20px",
                  }}>
                    📅
                  </div>
                  <h3 style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "var(--text-primary)",
                    marginBottom: "12px",
                  }}>
                    {searchTerm || categoryFilter !== 'All' 
                      ? "No events found" 
                      : "No events yet"}
                  </h3>
                  <p style={{
                    fontSize: "15px",
                    color: "var(--text-secondary)",
                    marginBottom: "24px",
                    lineHeight: "1.6",
                  }}>
                    {searchTerm || categoryFilter !== 'All'
                      ? "Try adjusting your search or filters to find events."
                      : "Be the first to create an event and get the community started!"}
                  </p>
                  {!userDataLoading && userData && (userData.role === 'Club/Society' || userData.role === 'club') && (
                    <button
                      onClick={() => setCreateEventModalOpen(true)}
                      className="btn btn-primary"
                      style={{
                        fontSize: "16px",
                        padding: "14px 32px",
                        fontWeight: "600",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>✨</span>
                      Create Your First Event
                    </button>
                  )}
                </div>
              ) : (
                sortedEvents.map((event) => {
              const isRegistered = event.registrations?.includes(user.uid);
              const isCreator = event.createdBy === user.uid;
              const registrationCount = event.registrations?.length || 0;
              const isFull = registrationCount >= event.maxRegistrations;
              const eventDate = new Date(event.startTime);
              const now = new Date();
              const isPast = eventDate < now;
              
              return (
                <div key={event.id} data-event-id={event.id} className="card animate-fade-in" style={{
                  padding: 0,
                  background: "var(--bg-card)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "var(--radius-xl)",
                  overflow: "hidden",
                  position: "relative",
                  boxShadow: "var(--shadow-md)",
                  marginBottom: "24px",
                }}>
                  {/* Instagram-style Header */}
                  <div style={{
                    padding: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border-primary)",
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      flex: 1,
                    }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "var(--gradient-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "700",
                        fontSize: "16px",
                        flexShrink: 0,
                      }}>
                        {(userNames[event.createdBy] || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "var(--text-primary)",
                          marginBottom: "2px",
                        }}>
                          {userNames[event.createdBy] || 'Loading...'}
                        </div>
                        <div style={{
                          fontSize: "12px",
                          color: "var(--text-muted)",
                        }}>
                          {new Date(event.createdAt?.toDate ? event.createdAt.toDate() : event.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {isPast && (
                        <div style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          background: "rgba(107, 114, 128, 0.15)",
                          color: "#6b7280",
                          borderRadius: "var(--radius-full)",
                          fontSize: "10px",
                          fontWeight: "600",
                          border: "1px solid rgba(107, 114, 128, 0.3)",
                          marginRight: "8px",
                        }}>
                          Past Event
                        </div>
                      )}
                      {isCreator && userData && (userData.role === 'Club/Society' || userData.role === 'club') && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(event);
                            }}
                            style={{ 
                              padding: "8px",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "18px",
                              borderRadius: "var(--radius-md)",
                              transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) => e.target.style.background = "var(--bg-tertiary)"}
                            onMouseLeave={(e) => e.target.style.background = "transparent"}
                            title="Edit Event"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(event.id);
                            }}
                            style={{ 
                              padding: "8px",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "18px",
                              borderRadius: "var(--radius-md)",
                              transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) => e.target.style.background = "var(--bg-tertiary)"}
                            onMouseLeave={(e) => e.target.style.background = "transparent"}
                            title="Delete Event"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div style={{ padding: "16px" }}>
                    {/* Title and Category */}
                    <div style={{ marginBottom: "12px" }}>
                      <h3 style={{ 
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "var(--text-primary)",
                        marginBottom: "8px",
                        lineHeight: "1.3",
                      }}>
                        {event.title}
                      </h3>
                      <div style={{ 
                        display: "inline-block",
                        padding: "4px 12px",
                        background: "var(--gradient-primary)",
                        color: "var(--text-inverse)",
                        borderRadius: "var(--radius-full)",
                        fontSize: "11px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}>
                        {event.category}
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p style={{ 
                      color: "var(--text-secondary)",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      marginBottom: "16px",
                    }}>
                      {event.description}
                    </p>
                    
                    {/* Event Details */}
                    <div style={{ 
                      marginBottom: "16px",
                      padding: "12px",
                      background: "var(--bg-tertiary)",
                      borderRadius: "var(--radius-lg)",
                      fontSize: "13px",
                    }}>
                      <div style={{ 
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                      }}>
                        <span style={{ fontSize: "16px" }}>📍</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: "500" }}>
                          {event.location}
                        </span>
                      </div>
                      <div style={{ 
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                      }}>
                        <span style={{ fontSize: "16px" }}>📅</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: "500" }}>
                          {new Date(event.startTime).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div style={{ 
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}>
                        <span style={{ fontSize: "16px" }}>👥</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: "500" }}>
                          {registrationCount}/{event.maxRegistrations} registered
                        </span>
                      </div>
                    </div>
                    
                    {/* Register Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRegister(event.id, isRegistered);
                      }}
                      className={`btn ${isRegistered ? 'btn-danger' : 'btn-success'}`}
                      disabled={!isRegistered && isFull}
                      style={{ 
                        width: "100%",
                        fontSize: "14px",
                        padding: "12px",
                        marginBottom: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {isRegistered ? '✓ Registered' : isFull ? 'Event Full' : 'Register Now'}
                    </button>

                    {/* Registrations Button - Always show for club users who created the event */}
                    {isCreator && userData && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventRegistrants({
                            eventTitle: event.title,
                            registrations: event.registrations || []
                          });
                          setRegistrantsModalOpen(true);
                        }}
                        style={{ 
                          marginBottom: "16px",
                          padding: "12px",
                          background: event.registrations && event.registrations.length > 0 ? "var(--gradient-primary)" : "var(--bg-tertiary)",
                          borderRadius: "var(--radius-lg)",
                          border: "1px solid var(--border-primary)",
                          cursor: "pointer",
                          width: "100%",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: event.registrations && event.registrations.length > 0 ? "white" : "var(--text-primary)",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--bg-secondary)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = event.registrations && event.registrations.length > 0 ? "var(--gradient-primary)" : "var(--bg-tertiary)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        {event.registrations && event.registrations.length > 0 
                          ? `👥 View Registrants (${event.registrations.length})`
                          : '📋 View Registrants (0)'
                        }
                      </button>
                    )}
                  </div>

                  {/* Comments Section - Instagram style */}
                  <div style={{ 
                    borderTop: "1px solid var(--border-primary)",
                    padding: "12px 16px",
                  }}>
                    {/* Comments List */}
                    {event.comments && event.comments.length > 0 && (
                      <div style={{ 
                        maxHeight: "150px",
                        overflowY: "auto",
                        marginBottom: "12px",
                      }}>
                        {event.comments.map((comment, index) => (
                          <div key={index} style={{ 
                            marginBottom: "12px",
                            fontSize: "13px",
                          }}>
                            <div style={{ 
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "8px",
                            }}>
                              <div style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                background: "var(--gradient-primary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontWeight: "600",
                                fontSize: "11px",
                                flexShrink: 0,
                              }}>
                                {comment.author.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ 
                                  fontWeight: "600",
                                  color: "var(--text-primary)",
                                  marginBottom: "2px",
                                  fontSize: "13px",
                                }}>
                                  {comment.author}
                                </div>
                                <div style={{ 
                                  color: "var(--text-secondary)",
                                  fontSize: "13px",
                                  lineHeight: "1.4",
                                  wordBreak: "break-word",
                                }}>
                                  {comment.text}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Comment Input */}
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const comment = e.target.comment.value;
                      if (comment.trim()) {
                        handleComment(event.id, comment);
                        e.target.reset();
                      }
                    }} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "var(--gradient-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "600",
                        fontSize: "12px",
                        flexShrink: 0,
                      }}>
                        {(userData?.name || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <input
                        type="text"
                        name="comment"
                        placeholder="Add a comment..."
                        className="input"
                        style={{ 
                          fontSize: "13px",
                          padding: "8px 12px",
                          marginBottom: 0,
                          flex: 1,
                          borderRadius: "var(--radius-full)",
                        }}
                      />
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ 
                          padding: "8px 16px",
                          fontSize: "13px",
                          borderRadius: "var(--radius-full)",
                          fontWeight: "600",
                        }}
                      >
                        Post
                      </button>
                    </form>
                  </div>
            </div>
              );
                })
              )}
            </div>
          </div>

          {/* Sidebar Widgets */}
          <div style={{
            width: "320px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            position: "sticky",
            top: "20px",
            maxHeight: "calc(100vh - 40px)",
            overflowY: "auto",
            overflowX: "visible",
            marginRight: "20px",
            paddingRight: "4px",
          }}
          className="sidebar-widgets"
          >
            {/* Calendar Widget */}
            <div className="card" style={{
              padding: "20px",
              background: "var(--gradient-card)",
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-xl)",
            }}>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "var(--text-primary)",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                📅 Calendar
              </h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "4px",
                marginBottom: "10px",
              }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} style={{
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "var(--text-muted)",
                    padding: "4px",
                  }}>
                    {day}
                  </div>
                ))}
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "4px",
                marginBottom: "0",
              }}>
                {(() => {
                  const today = new Date();
                  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                  const startDate = new Date(firstDay);
                  startDate.setDate(startDate.getDate() - startDate.getDay());
                  
                  const days = [];
                  for (let i = 0; i < 35; i++) {
                    const date = new Date(startDate);
                    date.setDate(startDate.getDate() + i);
                    const dateStr = date.toISOString().split('T')[0];
                    const dateEvents = events.filter(e => {
                      const eventDate = new Date(e.startTime).toISOString().split('T')[0];
                      return eventDate === dateStr;
                    });
                    const hasEvent = dateEvents.length > 0;
                    const isToday = date.toDateString() === today.toDateString();
                    const isCurrentMonth = date.getMonth() === today.getMonth();
                    
                    days.push(
                      <div
                        key={i}
                        onClick={() => {
                          if (hasEvent && dateEvents.length > 0) {
                            const firstEvent = document.querySelector(`[data-event-id="${dateEvents[0].id}"]`);
                            if (firstEvent) {
                              firstEvent.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }
                        }}
                        style={{
                          aspectRatio: "1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: isToday ? "700" : "500",
                          color: isCurrentMonth ? "var(--text-primary)" : "var(--text-muted)",
                          background: isToday 
                            ? "var(--gradient-primary)" 
                            : hasEvent 
                              ? "rgba(99, 102, 241, 0.1)" 
                              : "transparent",
                          borderRadius: "var(--radius-sm)",
                          border: isToday ? "1.5px solid var(--gradient-primary)" : "none",
                          position: "relative",
                          cursor: hasEvent ? "pointer" : "default",
                          transition: "all 0.2s ease",
                          minHeight: "36px",
                        }}
                        onMouseEnter={(e) => {
                          if (hasEvent) {
                            e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)";
                            e.currentTarget.style.transform = "scale(1.1)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (hasEvent) {
                            e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                            e.currentTarget.style.transform = "scale(1)";
                          }
                        }}
                        title={hasEvent ? `Click to view ${dateEvents.length} event(s) on ${date.toLocaleDateString()}` : ""}
                      >
                        {date.getDate()}
                        {hasEvent && !isToday && (
                          <div style={{
                            position: "absolute",
                            bottom: "2px",
                            width: "4px",
                            height: "4px",
                            borderRadius: "50%",
                            background: "var(--gradient-primary)",
                          }} />
                        )}
                      </div>
                    );
                  }
                  return days;
                })()}
              </div>
            </div>

            {/* Most Popular Events */}
            <div className="card" style={{
              padding: "20px",
              background: "var(--gradient-card)",
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-xl)",
            }}>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "var(--text-primary)",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                🔥 Most Popular
              </h3>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                maxHeight: "400px",
                overflowY: "auto",
              }}>
                {events
                  .filter(e => {
                    const eventDate = new Date(e.startTime);
                    const now = new Date();
                    return eventDate >= now;
                  })
                  .sort((a, b) => {
                    const aRegistrations = a.registrations?.length || 0;
                    const bRegistrations = b.registrations?.length || 0;
                    return bRegistrations - aRegistrations;
                  })
                  .slice(0, 5)
                  .map(event => (
                    <div
                      key={event.id}
                      onClick={() => {
                        const eventElement = document.querySelector(`[data-event-id="${event.id}"]`);
                        if (eventElement) {
                          eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                      style={{
                        padding: "14px",
                        background: "var(--bg-tertiary)",
                        borderRadius: "var(--radius-md)",
                        marginBottom: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        fontSize: "13px",
                        border: "1px solid var(--border-primary)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--bg-secondary)";
                        e.currentTarget.style.transform = "translateX(4px)";
                        e.currentTarget.style.borderColor = "var(--gradient-primary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--bg-tertiary)";
                        e.currentTarget.style.transform = "translateX(0)";
                        e.currentTarget.style.borderColor = "var(--border-primary)";
                      }}
                    >
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "4px",
                      }}>
                        <div style={{
                          fontWeight: "600",
                          color: "var(--text-primary)",
                          fontSize: "14px",
                          flex: 1,
                          lineHeight: "1.4",
                        }}>
                          {event.title}
                        </div>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "var(--gradient-primary)",
                          color: "var(--text-inverse)",
                          padding: "4px 8px",
                          borderRadius: "var(--radius-full)",
                          fontSize: "11px",
                          fontWeight: "700",
                          marginLeft: "8px",
                          flexShrink: 0,
                        }}>
                          👥 {event.registrations?.length || 0}
                        </div>
                      </div>
                      <div style={{
                        color: "var(--text-muted)",
                        fontSize: "12px",
                        marginBottom: "4px",
                      }}>
                        📅 {new Date(event.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div style={{
                        color: "var(--text-muted)",
                        fontSize: "12px",
                      }}>
                        📍 {event.location}
                      </div>
                    </div>
                  ))}
                {events.filter(e => {
                  const eventDate = new Date(e.startTime);
                  const now = new Date();
                  return eventDate >= now;
                }).length === 0 && (
                  <div style={{
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    fontStyle: "italic",
                    padding: "20px",
                    textAlign: "center",
                  }}>
                    No events available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {createEventModalOpen && (
        <div className="modal-overlay" onClick={() => setCreateEventModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "32px" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "28px",
              }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--gradient-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                }}>
                  ✨
                </div>
                <h2 style={{ 
                  margin: 0,
                  fontSize: "26px",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.02em",
                }}>
                  Create New Event
                </h2>
              </div>
              <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
                <div>
                  <label style={{ 
                    display: "block",
                    marginBottom: "10px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    letterSpacing: "-0.01em",
                  }}>
                    Event Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="input"
                    placeholder="Enter event title"
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block",
                    marginBottom: "10px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    letterSpacing: "-0.01em",
                  }}>
                    Category
                  </label>
                  <select name="category" required className="select">
                    <option value="">Select category</option>
                    <option value="Sports">Sports</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Club">Club</option>
                    <option value="Social">Social</option>
                    <option value="Academic">Academic</option>
                  </select>
                </div>
                <div>
                  <label style={{ 
                    display: "block",
                    marginBottom: "10px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    letterSpacing: "-0.01em",
                  }}>
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    required
                    className="input"
                    placeholder="Enter location"
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block",
                    marginBottom: "10px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    letterSpacing: "-0.01em",
                  }}>
                    Max Registrations
                  </label>
                  <input
                    type="number"
                    name="maxRegistrations"
                    required
                    min="1"
                    className="input"
                    placeholder="Enter max registrations"
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block",
                    marginBottom: "10px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    letterSpacing: "-0.01em",
                  }}>
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block",
                    marginBottom: "10px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    letterSpacing: "-0.01em",
                  }}>
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    required
                    className="input"
                  />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ 
                    display: "block",
                    marginBottom: "10px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    letterSpacing: "-0.01em",
                  }}>
                    Description
                  </label>
                  <textarea
                    name="description"
                    required
                    className="textarea"
                    placeholder="Enter event description"
                    rows="4"
                  />
                </div>
                <div style={{ gridColumn: "span 2", display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setCreateEventModalOpen(false)}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{
                      flex: 1,
                      fontSize: "16px",
                      padding: "14px 32px",
                      fontWeight: "600",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {loading ? (
                      <>
                        <div className="spinner" />
                        Creating Event...
                      </>
                    ) : (
                      '✨ Create Event'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editOpen && editEvent && (
        <div className="modal-overlay" onClick={() => setEditOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "24px" }}>
              <h2 style={{ 
                marginBottom: "24px",
                fontSize: "24px",
                fontWeight: "700",
                color: "var(--text-primary)",
              }}>
                Edit Event
              </h2>
              <form onSubmit={handleUpdateEvent} style={{ display: "grid", gap: "16px" }}>
                <div>
                  <label style={{ 
                    display: "block",
                    marginBottom: "10px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    letterSpacing: "-0.01em",
                  }}>
                    Event Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editEvent.title}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block",
                    marginBottom: "10px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    letterSpacing: "-0.01em",
                  }}>
                    Category
                  </label>
                  <select name="category" defaultValue={editEvent.category} required className="select">
            <option value="Sports">Sports</option>
            <option value="Workshop">Workshop</option>
            <option value="Club">Club</option>
                    <option value="Social">Social</option>
                    <option value="Academic">Academic</option>
          </select>
                </div>
                <div>
                  <label style={{ 
                    display: "block",
                    marginBottom: "10px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    letterSpacing: "-0.01em",
                  }}>
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={editEvent.location}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block",
                    marginBottom: "10px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    letterSpacing: "-0.01em",
                  }}>
                    Max Registrations
                  </label>
                  <input
                    type="number"
                    name="maxRegistrations"
                    defaultValue={editEvent.maxRegistrations}
                    required
                    min="1"
                    className="input"
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block",
                    marginBottom: "10px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    letterSpacing: "-0.01em",
                  }}>
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    defaultValue={editEvent.startTime}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block",
                    marginBottom: "10px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    letterSpacing: "-0.01em",
                  }}>
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    defaultValue={editEvent.endTime}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block",
                    marginBottom: "10px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    letterSpacing: "-0.01em",
                  }}>
                    Description
                  </label>
          <textarea
                    name="description"
                    defaultValue={editEvent.description}
                    required
                    className="textarea"
                    rows="4"
                  />
                </div>
                <div style={{ display: "flex", gap: "16px" }}>
          <button
            type="button"
                    onClick={() => setEditOpen(false)}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
          >
            Cancel
          </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ flex: 1 }}
                  >
                    {loading ? (
                      <>
                        <div className="spinner" />
                        Updating...
                      </>
                    ) : (
                      'Update Event'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Registrants Modal */}
      {registrantsModalOpen && selectedEventRegistrants && (
        <div className="modal-overlay" onClick={() => setRegistrantsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "24px" }}>
              <h2 style={{ 
                marginBottom: "24px",
                fontSize: "24px",
                fontWeight: "700",
                color: "var(--text-primary)",
              }}>
                Registrants - {selectedEventRegistrants.eventTitle}
              </h2>

              <div style={{ 
                maxHeight: "400px",
                overflowY: "auto",
                marginBottom: "16px",
              }}>
                {selectedEventRegistrants.registrations.map((userId, index) => (
                  <div key={index} style={{ 
                    padding: "12px",
                    background: "var(--bg-tertiary)",
                    borderRadius: "var(--radius-lg)",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}>
                    <div style={{ 
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "var(--gradient-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "600",
                      fontSize: "14px",
                    }}>
                      {userNames[userId] ? userNames[userId].charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "var(--text-primary)",
                      }}>
                        {userNames[userId] || 'Loading...'}
                      </div>
                      <div style={{ 
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                      }}>
                        {userId}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setRegistrantsModalOpen(false)}
                className="btn btn-primary"
                style={{ width: "100%" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unregister Confirmation Modal */}
      {unregisterModalOpen && eventToUnregister && (
        <div className="modal-overlay" onClick={() => {
          setUnregisterModalOpen(false);
          setEventToUnregister(null);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div style={{ padding: "32px" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "24px",
              }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "var(--radius-lg)",
                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                }}>
                  ⚠️
                </div>
                <div>
                  <h2 style={{ 
                    margin: 0,
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                  }}>
                    Unregister from Event?
                  </h2>
                </div>
              </div>
              
              <p style={{
                fontSize: "16px",
                color: "var(--text-secondary)",
                lineHeight: "1.6",
                marginBottom: "8px",
              }}>
                Are you sure you want to unregister from <strong style={{ color: "var(--text-primary)" }}>{eventToUnregister.title}</strong>?
              </p>
              
              <p style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: "1.5",
                marginBottom: "28px",
              }}>
                This action cannot be undone. You'll need to register again if you change your mind.
              </p>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => {
                    setUnregisterModalOpen(false);
                    setEventToUnregister(null);
                  }}
                  className="btn btn-secondary"
                  style={{ 
                    flex: 1,
                    fontSize: "15px",
                    padding: "12px 24px",
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUnregister}
                  className="btn btn-danger"
                  style={{ 
                    flex: 1,
                    fontSize: "15px",
                    padding: "12px 24px",
                    fontWeight: "600",
                  }}
                >
                  Confirm Unregister
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type} animate-slide-up`}>
          {notification.message}
        </div>
      )}

      {/* Floating Chatbot Button */}
        <button
        onClick={() => setChatbotOpen(true)}
        className="floating"
        style={{
          bottom: "24px",
          right: "24px",
          background: "var(--gradient-primary)",
          border: "none",
          borderRadius: "50%",
          width: "60px",
          height: "60px",
          color: "var(--text-inverse)",
          cursor: "pointer",
          fontSize: "24px",
          zIndex: 1000,
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
        }}
        onMouseOver={(e) => {
          e.target.style.transform = "scale(1.1)";
          e.target.style.boxShadow = "var(--shadow-xl)";
        }}
        onMouseOut={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.boxShadow = "var(--shadow-lg)";
        }}
      >
        💬
        </button>

      {/* Chatbot */}
      <Chatbot isOpen={chatbotOpen} onClose={() => setChatbotOpen(false)} events={events} />
    </div>
  );
};

export default Dashboard;
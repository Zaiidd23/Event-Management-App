import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import Dashboard from './Dashboard';
import { auth, db } from './firebase';
import { ThemeProvider, useTheme } from './ThemeContext';

const AppContent = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoadingAuth(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: formData.name,
          role: formData.role,
          email: formData.email,
          createdAt: new Date()
        });
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingAuth(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--gradient-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-primary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '18px', fontWeight: '500' }}>Loading Acadia Hub...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--gradient-bg)',
      color: 'var(--text-primary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background Decorations */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)',
        animation: 'float 25s ease-in-out infinite',
        zIndex: 0,
      }} />
      
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '20%',
        width: '400px',
        height: '400px',
        background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
        borderRadius: '50%',
        filter: 'blur(120px)',
        animation: 'float 20s ease-in-out infinite reverse',
        zIndex: 0,
      }} />

      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        background: 'linear-gradient(45deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1))',
        borderRadius: '50%',
        filter: 'blur(100px)',
        animation: 'float 30s ease-in-out infinite',
        zIndex: 0,
      }} />

      <div className="container" style={{ 
        position: 'relative', 
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 0',
      }}>
        <div className="card" style={{
          width: '100%',
          maxWidth: '400px',
          padding: '2rem',
          background: 'var(--gradient-card)',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-2xl)',
          position: 'relative',
        }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'var(--gradient-primary)',
              borderRadius: 'var(--radius-2xl)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              fontSize: '24px',
              boxShadow: 'var(--shadow-lg)',
            }}>
              🎓
            </div>
            
            <h1 style={{
              fontSize: '28px',
              fontWeight: '800',
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em',
            }}>
              Acadia Hub
            </h1>
            
            <p style={{
              fontSize: '16px',
              color: 'var(--text-muted)',
              fontWeight: '500',
            }}>
              {isLogin ? 'Welcome back! Sign in to continue' : 'Join the community! Create your account'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            {!isLogin && (
              <>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className="input"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}>
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className="select"
                  >
                    <option value="">Select your role</option>
                    <option value="Student">Student</option>
                    <option value="Club/Society">Club/Society</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                fontSize: '14px',
              }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="input"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                fontSize: '14px',
              }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="input"
                placeholder="Enter your password"
                minLength="6"
              />
            </div>

            {error && (
              <div style={{
                padding: '0.75rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-lg)',
                color: '#dc2626',
                fontSize: '14px',
                fontWeight: '500',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loadingAuth}
              style={{
                fontSize: '16px',
                padding: '12px 24px',
                width: '100%',
                fontWeight: '700',
              }}
            >
              {loadingAuth ? (
                <>
                  <div className="spinner" />
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '14px',
              marginBottom: '1rem',
            }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({ name: '', role: '', email: '', password: '' });
              }}
              className="btn btn-ghost"
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-accent)',
                padding: '8px 16px',
              }}
            >
              {isLogin ? 'Create New Account' : 'Sign In Instead'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
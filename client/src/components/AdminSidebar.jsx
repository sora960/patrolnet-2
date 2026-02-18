import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css'; // Assuming common CSS
import UserProfileModal from './UserProfileModal';
import { BASE_URL } from '../config';

const AdminSidebar = ({ currentUser, onLogout }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [newIncidentCount, setNewIncidentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAlertPlaying, setIsAlertPlaying] = useState(false);
  const alertAudioRef = useRef({ context: null, oscillator: null, gain: null });
  const audioContextRef = useRef(null);
  const location = useLocation();

  // Alert system state and refs
  const previousIncidentsCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  const stopAlertSound = () => {
    if (alertAudioRef.current.oscillator) {
      try {
        // Stop all oscillators if they exist
        if (alertAudioRef.current.oscillators) {
          alertAudioRef.current.oscillators.forEach(osc => {
            try {
              osc.stop();
              osc.disconnect();
            } catch (e) {
              console.warn('Error stopping oscillator:', e);
            }
          });
        } else {
          alertAudioRef.current.oscillator.stop();
          alertAudioRef.current.oscillator.disconnect();
        }
        
        // Disconnect all gains
        if (alertAudioRef.current.gains) {
          alertAudioRef.current.gains.forEach(g => {
            try {
              g.disconnect();
            } catch (e) {
              console.warn('Error disconnecting gain:', e);
            }
          });
        }
        
        alertAudioRef.current.gain.disconnect();
        
        alertAudioRef.current = { context: null, oscillator: null, gain: null };
        setIsAlertPlaying(false);
        console.log('✅ EMERGENCY ALERT ACKNOWLEDGED - ALARM STOPPED ✅');
      } catch (error) {
        console.warn('Error stopping alert:', error);
        setIsAlertPlaying(false);
      }
    }
  };

  // Emergency alert sound function
  const playAlertSound = async () => {
    if (isAlertPlaying) {
      console.log('Alert already playing, skipping...');
      return;
    }

    // Do not proceed if the audio context hasn't been initialized by a user gesture.
    if (!audioContextRef.current) {
      console.warn('Audio not yet enabled by user gesture. Cannot play alert.');
      return;
    }

    try {
      console.log('🚨 Starting emergency alert sound...');
      setIsAlertPlaying(true);
      
      const context = audioContextRef.current;
      // Attempt to resume the context if it's suspended. This is crucial.
      if (context.state === 'suspended') await context.resume();
      
      console.log('Audio context state:', context.state);
      
      // Create a single oscillator for a classic siren sound
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.connect(gain);
      gain.connect(context.destination);

      alertAudioRef.current = { 
        context, 
        oscillator: oscillator, 
        gain: gain,
        oscillators: [oscillator], // Keep as array for stop function compatibility
        gains: [gain]
      };

      oscillator.type = 'sine';
      gain.gain.value = 0.5;

      const createSiren = () => {
        const now = context.currentTime;
        const highPitch = 1000;
        const lowPitch = 400;
        const cycleDuration = 1.0;
        for (let i = 0; i < 300; i++) {
          const cycleStartTime = now + i * cycleDuration;
          oscillator.frequency.setValueAtTime(lowPitch, cycleStartTime);
          oscillator.frequency.linearRampToValueAtTime(highPitch, cycleStartTime + cycleDuration / 2);
          oscillator.frequency.linearRampToValueAtTime(lowPitch, cycleStartTime + cycleDuration);
        }
      };

      oscillator.start();
      createSiren();

      // Keep audio playing even in background tabs - FORCE RESUME
      const visibilityListener = () => {
        if (alertAudioRef.current.context?.state === 'suspended') {
          alertAudioRef.current.context.resume();
          console.log('🚨 RESUMING EMERGENCY ALERT SOUND 🚨');
        }
      };
      document.addEventListener('visibilitychange', visibilityListener);

      // Periodically check and resume if suspended (every 2 seconds)
      const resumeInterval = setInterval(() => {
        if (alertAudioRef.current.context?.state === 'suspended') {
          alertAudioRef.current.context.resume();
        }
      }, 2000);

      console.log('🚨🚨🚨 EMERGENCY SIREN ALERT ACTIVATED 🚨🚨🚨');
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 NEW INCIDENT ALERT', {
          body: 'Emergency: New incident report requires immediate attention!',
          icon: '🚨',
          tag: 'emergency-incident',
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200, 100, 200]
        });
      }
    } catch (error) {
      console.warn('Could not play emergency alert:', error);
      setIsAlertPlaying(false);
    }
  };

  // Monitor incidents for new alerts
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const initAudio = () => {
      if (!audioContextRef.current) {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = context;
        if (context.state === 'suspended') {
          context.resume().then(() => console.log('✅ Audio enabled - ready for alerts'));
        } else {
          console.log('✅ Audio enabled - ready for alerts');
        }
      }
    };

    const events = ['click', 'touchstart', 'keydown', 'mousedown'];
    events.forEach(event => document.addEventListener(event, initAudio, { once: true }));

    const monitorIncidents = () => {
      fetch(`${BASE_URL}/api/incidents`)
        .then(res => res.json())
        .then(data => {
          const currentCount = data.length;

          if (!isInitialLoadRef.current && currentCount > previousIncidentsCountRef.current) {
            const newIncidentsCount = currentCount - previousIncidentsCountRef.current;
            console.log(`🚨 ${newIncidentsCount} new incident(s) detected!`);

            setNewIncidentCount(prev => prev + newIncidentsCount);
            playAlertSound().catch(err => console.error("Error trying to play sound:", err));
          }

          previousIncidentsCountRef.current = currentCount;

          if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
          }
        })
        .catch(err => {
          console.error("Failed to fetch incidents:", err);
        });
    };

    monitorIncidents();
    const intervalId = setInterval(monitorIncidents, 3000);
    return () => {
      events.forEach(event => document.removeEventListener(event, initAudio));
      clearInterval(intervalId);
    };
  }, []);

  // Clear notification count when visiting incident report page
  useEffect(() => {
    if (location.pathname === '/incident-report' && newIncidentCount > 0) {
      stopAlertSound();
      const timeoutId = setTimeout(() => {
        setNewIncidentCount(0);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [location.pathname]);

  // Fetch user profile data
  const fetchUserProfile = async () => {
    const username = localStorage.getItem('username') || currentUser?.username;

    if (username) {
      try {
        const url = `${BASE_URL}/api/user/${username}`;
        const response = await fetch(url);

        if (response.ok) {
          const userData = await response.json();
          setUserProfile(userData);

          if (userData.IMAGE && !localStorage.getItem('userImage')) {
            localStorage.setItem('userImage', userData.IMAGE);
          }
        } else {
          const errorData = await response.text();
          console.error('Failed to fetch user profile. Status:', response.status);
          console.error('Error response:', errorData);
        }
      } catch (error) {
        console.error('Network error fetching user profile:', error);
      }
    } else {
      console.error('No username found for profile fetch');
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [currentUser]);

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      if (!target.closest('.user-avatar-container')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setShowProfileDropdown(false);
    stopAlertSound();
    setIsLoading(true);

    if (onLogout) {
      onLogout();
    } else {
      console.error('onLogout prop not provided to Sidebar');
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
    setShowProfileDropdown(false);
  };

  const handleProfileSave = () => {
    fetchUserProfile();
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const getAvatarSrc = () => {
    const storedImage = localStorage.getItem('userImage');
    if (storedImage && storedImage.trim() !== '') {
      return `${BASE_URL}/uploads/${storedImage}`;
    }

    if (userProfile && userProfile.IMAGE && userProfile.IMAGE.trim() !== '') {
      return `${BASE_URL}/uploads/${userProfile.IMAGE}`;
    }

    return "/defprof1.png";
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Logging out...</p>
        </div>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isCollapsed ? 'collapsed' : 'open'}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            {!isCollapsed && <h1 className="brand-text">Admin Dashboard</h1>}
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navigationItems.map((item) => (
              <li key={item.path} className="nav-item">
                <Link
                  to={item.path}
                  className={`nav-link ${
                    isActiveRoute(item.path) ? 'active' : ''
                  }`}
                  title={isCollapsed ? item.label : ''}
                  onClick={() => console.log(`Clicked: ${item.label} (${item.path})`)}
                >
                  <div className="nav-icon">
                    {item.icon}
                  </div>
                  {!isCollapsed && (
                    <span className="nav-label">{item.label}</span>
                  )}
                  {/* Notification badge - only for incident report */}
                  {item.path === '/incident-report' && newIncidentCount > 0 && (
                    <span className="notification-badge">
                      {newIncidentCount > 99 ? '99+' : newIncidentCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Alert indicator */}
        {newIncidentCount > 0 && !isCollapsed && (
          <div className="alert-indicator">
            <div className="alert-content">
              <span className="alert-icon">🚨</span>
              <span className="alert-text">
                {newIncidentCount} New Alert{newIncidentCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* User Profile Section */}
        <div className="sidebar-footer">
          <div className="user-avatar-container">
            <button
              onClick={toggleProfileDropdown}
              className="user-avatar-btn"
              title={isCollapsed ? (userProfile?.NAME || 'User Profile') : ''}
            >
              <img
                src={getAvatarSrc()}
                alt="User Avatar"
                className="user-avatar"
                onError={(e) => {
                  e.target.src = "/defprof1.png";
                }}
              />
              {!isCollapsed && (
                <div className="user-info">
                  <div className="user-name">
                    {userProfile?.NAME || localStorage.getItem('username') || 'User'}
                  </div>
                </div>
              )}
              {!isCollapsed && (
                <svg className="dropdown-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                </svg>
              )}
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className={`profile-dropdown ${isCollapsed ? 'collapsed' : ''}`}>
                <button onClick={handleProfileClick} className="dropdown-item">
                  <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </button>
                <button onClick={handleLogout} className="dropdown-item logout">
                  <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userProfile={userProfile}
        onSave={handleProfileSave}
      />
    </>
  );
};

export default AdminSidebar;
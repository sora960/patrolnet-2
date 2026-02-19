import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css'; 
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

  // 🚨 RESTORED: CORE PATROL OPERATIONS & PRO ICONS
  const navigationItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2 2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6-4h4" />
        </svg>
      )
    },
    {
      path: '/gis-mapping',
      label: 'GIS Risk Map',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    },
    {
      path: '/incident-report',
      label: 'Incident Reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      path: '/patrol-logs',
      label: 'Patrol Logs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      path: '/scheduling',
      label: 'Duty Scheduling',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      path: '/attendance',
      label: 'Attendance',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        </svg>
      )
    },
    {
      path: '/accounts',
      label: 'User Accounts',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    {
      path: '/firewall',
      label: 'Firewall',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z" />
        </svg>
      )
    },
    {
      path: '/messages',
      label: 'Messages',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      path: '/admin-announcements',
      label: 'Announcements',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    },
    {
      path: '/tourist-spots',
      label: 'Tourist Spots',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
      )
    },
    {
      path: '/Admin-activities',
      label: 'Activities',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];

  // Alert system state and refs
  const previousIncidentsCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  const stopAlertSound = () => {
    if (alertAudioRef.current.oscillator) {
      try {
        if (alertAudioRef.current.oscillators) {
          alertAudioRef.current.oscillators.forEach(osc => {
            try { osc.stop(); osc.disconnect(); } catch (e) { console.warn('Error stopping oscillator:', e); }
          });
        } else {
          alertAudioRef.current.oscillator.stop();
          alertAudioRef.current.oscillator.disconnect();
        }
        
        if (alertAudioRef.current.gains) {
          alertAudioRef.current.gains.forEach(g => {
            try { g.disconnect(); } catch (e) { console.warn('Error disconnecting gain:', e); }
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

  const playAlertSound = async () => {
    if (isAlertPlaying) {
      console.log('Alert already playing, skipping...');
      return;
    }

    if (!audioContextRef.current) {
      console.warn('Audio not yet enabled by user gesture. Cannot play alert.');
      return;
    }

    try {
      console.log('🚨 Starting emergency alert sound...');
      setIsAlertPlaying(true);
      
      const context = audioContextRef.current;
      if (context.state === 'suspended') await context.resume();
      
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.connect(gain);
      gain.connect(context.destination);

      alertAudioRef.current = { 
        context, 
        oscillator: oscillator, 
        gain: gain,
        oscillators: [oscillator],
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

      const visibilityListener = () => {
        if (alertAudioRef.current.context?.state === 'suspended') {
          alertAudioRef.current.context.resume();
        }
      };
      document.addEventListener('visibilitychange', visibilityListener);

      // ESLINT FIX: removed 'const resumeInterval =' to prevent unused variable warning
      setInterval(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (location.pathname === '/incident-report' && newIncidentCount > 0) {
      stopAlertSound();
      const timeoutId = setTimeout(() => {
        setNewIncidentCount(0);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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
    }
  };

  useEffect(() => {
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const toggleProfileDropdown = () => setShowProfileDropdown(!showProfileDropdown);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      if (!target.closest('.user-avatar-container')) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowProfileDropdown(false);
    stopAlertSound();
    setIsLoading(true);

    if (onLogout) {
      onLogout();
    } else {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
    setShowProfileDropdown(false);
  };

  const handleProfileSave = () => fetchUserProfile();

  const isActiveRoute = (path) => location.pathname === path;

  const getAvatarSrc = () => {
    const storedImage = localStorage.getItem('userImage');
    if (storedImage && storedImage.trim() !== '') return `${BASE_URL}/uploads/${storedImage}`;
    if (userProfile && userProfile.IMAGE && userProfile.IMAGE.trim() !== '') return `${BASE_URL}/uploads/${userProfile.IMAGE}`;
    return "/defprof1.png";
  };

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <>
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Logging out...</p>
        </div>
      )}

      <div className={`sidebar ${isCollapsed ? 'collapsed' : 'open'}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            {!isCollapsed && <h1 className="brand-text">PatrolNet System</h1>}
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navigationItems.map((item) => (
              <li key={item.path} className="nav-item">
                <Link
                  to={item.path}
                  className={`nav-link ${isActiveRoute(item.path) ? 'active' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <div className="nav-icon">{item.icon}</div>
                  {!isCollapsed && <span className="nav-label">{item.label}</span>}
                  
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
                onError={(e) => { e.target.src = "/defprof1.png"; }}
              />
              {!isCollapsed && (
                <div className="user-info">
                  <div className="user-name">
                    {userProfile?.NAME || localStorage.getItem('username') || 'User'}
                  </div>
                </div>
              )}
              {!isCollapsed && (
                <svg className="dropdown-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>
              )}
            </button>

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
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css'; // Assuming common CSS
import UserProfileModal from './UserProfileModal';
import { BASE_URL } from '../config';

const TanodSidebar = ({ currentUser, onLogout }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [newIncidentCount, setNewIncidentCount] = useState(0); // Keep for potential future use or if Tanod needs some alerts
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAlertPlaying, setIsAlertPlaying] = useState(false);

  const alertAudioRef = useRef({ context: null, oscillator: null, gain: null });
  const audioContextRef = useRef(null);
  const location = useLocation();

  // Alert system state and refs (keeping for now, but alerts won't be displayed in Tanod sidebar)
  const previousIncidentsCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  const navigationItems = useMemo(() => {
    return [
      {
        path: '/incident-report',
        label: 'Incident Report',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      },
      {
        path: '/scheduling',
        label: 'Scheduling & Assignments',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      },
      {
        path: '/gis-mapping',
        label: 'GIS Mapping',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
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
        path: '/accounts',
        label: 'Accounts',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        )
      },
    ];
  }, []);

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
        
        // Don't close the context - we'll reuse it
        // alertAudioRef.current.context.close();
        
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

      // Set oscillator type for a classic siren sound
      oscillator.type = 'sine';
      gain.gain.value = 0.5; // Set a reasonable volume

      // --- CLASSIC TWO-TONE SIREN SOUND ---
      // Creates a wailing siren effect by modulating the frequency.
      const createSiren = () => {
        const now = context.currentTime;
        const highPitch = 1000; // High frequency in Hz
        const lowPitch = 400;   // Low frequency in Hz
        const cycleDuration = 1.0; // Duration of one up-down wail

        // Schedule the frequency to ramp up and down repeatedly.
        // This schedules several minutes worth of sound to ensure it loops.
        for (let i = 0; i < 300; i++) {
          const cycleStartTime = now + i * cycleDuration;
          oscillator.frequency.setValueAtTime(lowPitch, cycleStartTime);
          oscillator.frequency.linearRampToValueAtTime(highPitch, cycleStartTime + cycleDuration / 2);
          oscillator.frequency.linearRampToValueAtTime(lowPitch, cycleStartTime + cycleDuration);
        }
      };

      oscillator.start();
      console.log('Oscillator started');
      
      createSiren();
      console.log('Siren sound scheduled');

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

      // Cleanup listeners on stop
      const originalStop = oscillator.stop.bind(oscillator);
      oscillator.stop = () => {
        document.removeEventListener('visibilitychange', visibilityListener);
        clearInterval(resumeInterval);
        originalStop();
      };
      
      console.log('🚨🚨🚨 EMERGENCY SIREN ALERT ACTIVATED 🚨🚨🚨');
      console.log('⚠️ CONTINUOUS ALARM UNTIL ACKNOWLEDGED BY ADMIN ⚠️');

      // Enhanced notification with requireInteraction
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 EMERGENCY INCIDENT ALERT 🚨', {
          body: '⚠️ CRITICAL: New incident requires IMMEDIATE attention! Click to acknowledge.',
          icon: '🚨',
          tag: 'emergency-incident',
          requireInteraction: true,
          timestamp: Date.now(),
          vibrate: [200, 100, 200, 100, 200, 100, 200] // Vibration pattern for mobile
        });
      } 
    } catch (error) {
      console.warn('Could not play emergency alert:', error);
      setIsAlertPlaying(false);
    }
  };

  // Monitor incidents for new alerts (keeping for now, but alerts won't be displayed in Tanod sidebar)
  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Initialize AudioContext on first user interaction
    const initAudio = () => {
      if (!audioContextRef.current) {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = context;
        
        // Test the context
        if (context.state === 'suspended') {
          context.resume().then(() => {
            console.log('✅ Audio enabled - ready for emergency alerts');
          });
        } else {
          console.log('✅ Audio enabled - ready for emergency alerts');
        }
      }
    };
    
    // Listen for any user interaction to enable audio
    const events = ['click', 'touchstart', 'keydown', 'mousedown'];
    events.forEach(event => {
      document.addEventListener(event, initAudio, { once: true });
    });

    const monitorIncidents = () => {
      fetch(`${BASE_URL}/api/incidents`)
        .then(res => res.json())
        .then(data => {
          const currentCount = data.length;

          if (!isInitialLoadRef.current && currentCount > previousIncidentsCountRef.current) {
            const newIncidentsCount = currentCount - previousIncidentsCountRef.current;
            console.log(`🚨 ${newIncidentsCount} new incident(s) detected!`);

            setNewIncidentCount(prev => prev + newIncidentsCount);
            
            // Play alert immediately
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
      clearInterval(intervalId);
      events.forEach(event => {
        document.removeEventListener(event, initAudio);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <svg className="brand-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z"></path></svg>
            {!isCollapsed && <h1 className="brand-text">Tanod Dashboard</h1>}
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Alert indicator - NOT PRESENT IN TANOD SIDEBAR */}

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

export default TanodSidebar;
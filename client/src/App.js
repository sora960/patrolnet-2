import React, { useState, useEffect, useMemo, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Login from './components/Login.jsx';
import About from "./components/About.jsx";
import IncidentReport from "./components/Incident_Report.jsx";
import ScheduleAssignment from './components/ScheduleAssignment.jsx';
import PatrolLogs from "./components/Patrollogs.jsx";
import Accounts from "./components/Accounts.jsx";
import GISMapping from "./components/GISmapping.jsx";
import User from "./components/User.jsx";
import "./App.css";
import Landingpage from "./Landingpage.jsx";

import AdminActivities from "./components/AdminActivities.jsx";
import Dashboard from "./components/Dashboard.jsx";
import AdminAnnouncements from "./components/AdminAnnouncements.jsx";
import Download from "./components/Donwload.jsx";
import MainSidebarWrapper from "./components/MainSidebarWrapper.jsx";
import Messages from "./components/Messages.jsx";
import ContactUs from "./components/ContactUs.jsx";

import TouristSpots from "./components/TouristSpots.jsx";
import './i18n'; 
import Attendance from "./components/Attendance.jsx";
import Firewall from './components/Firewall';

// Components for Activities & Announcements
import Activities from "./components/Activities.jsx";
import Announcements from "./components/Announcements.jsx";

// User Profile Dropdown Component
function UserProfileDropdown({ user, onLogout, isLoggingOut, onViewProfile }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get user initials for avatar
  const getUserInitials = (username) => {
    if (!username) return 'U';
    const names = username.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  };

  // Get avatar color based on role
  const getAvatarColor = (role) => {
    const colors = {
      'Admin': '#e74c3c',
      'Admintanod': '#9b59b6',
      'Tanod': '#3498db',
      'Resident': '#27ae60'
    };
    return colors[role] || '#95a5a6';
  };

  return (
    <div className="user-profile-dropdown" ref={dropdownRef}>
      <button 
        className={`profile-avatar ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ backgroundColor: getAvatarColor(user.role) }}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <div className="avatar-spinner"></div>
        ) : (
          getUserInitials(user.username)
        )}
      </button>
      
      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <div className="user-info">
              <strong>{user.username}</strong>
              <span className="user-role-badge">{user.role}</span>
            </div>
          </div>
          <div className="dropdown-divider"></div>
          <button className="dropdown-item" onClick={() => {
            setIsOpen(false);
            onViewProfile();
          }}>
            <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            View Profile
          </button>
          <button className="dropdown-item logout-item" onClick={() => {
            setIsOpen(false);
            onLogout();
          }}>
            <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16,17 21,12 16,7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      )}
    </div>
  );
}

// Create a wrapper component to access navigate
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);


  // Derive isLoggedIn and userRole directly from localStorage on every render
  const initialIsLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const initialUserRole = localStorage.getItem("userRole") || "";

  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
  const [userRole, setUserRole] = useState(initialUserRole);

  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);
    setUserRole(userData.userRole);
    setShowLogin(false);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", userData.userRole);
    localStorage.setItem("username", userData.username);
    
    // Navigate to appropriate dashboard after login
    if (userData.userRole === "Tanod" || userData.userRole === "Admintanod") {
      navigate("/incident-report");
    } else if (userData.userRole === "Resident") {
      navigate("/user");
    } else {
      navigate("/dashboard");
    }
  };

  const handleLogout = () => {
    console.log("Logout initiated from App.js...");
    
    // Set loading state
    setIsLoggingOut(true);
    
    // Clear localStorage immediately
    localStorage.clear();
    
    // Clear all state immediately (synchronously)
    setIsLoggedIn(false);
    setUserRole("");
    setShowLogin(false);
    
    console.log("State cleared, navigating to home...");
    
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
      // Navigate to home and replace the current entry in history
      navigate("/", { replace: true });
      
      // Reset loading state
      setIsLoggingOut(false);
      
      console.log("Logout complete - should be on landing page");
    }, 50);
  };

  const handleViewProfile = () => {
    // You can navigate to a profile page or show a modal
    // For now, let's show an alert with user info
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("userRole");
    alert(`Profile Info:\nUsername: ${username}\nRole: ${role}`);
    // TODO: Replace this with actual profile modal or navigation
    // navigate("/profile");
  };

  // Helper functions for route protection
  const isAdmin = () => {
    return isLoggedIn && userRole !== "Tanod" && userRole !== "Resident";
  };

  const isTanodOrAdmin = () => {
    return isLoggedIn && (userRole === "Tanod" || userRole === "Admintanod" || isAdmin());
  };

  const isResident = () => {
    return isLoggedIn && userRole === "Resident";
  };

  const currentUser = useMemo(() => {
    const localStorageRole = localStorage.getItem('userRole');
    const localStorageUsername = localStorage.getItem('username');
    
    console.log('=== APP.JS CURRENT USER DEBUG ===');
    console.log('userRole state:', userRole);
    console.log('localStorage userRole:', localStorageRole);
    console.log('localStorage username:', localStorageUsername);
    
    const user = {
      username: localStorageUsername || '',
      role: String(userRole || localStorageRole || '').trim() // Ensure role is always a trimmed string
    };
    
    console.log('Final currentUser object being passed to Sidebar:', user);
    console.log('===============================\n'); // Added newline for clarity
    
    return user;
  }, [userRole]);

  // Check if we should show the sidebar
  const shouldShowSidebar = isLoggedIn && currentUser?.role && currentUser.role !== "Resident";

  return (
    <div className="app">
      {/* Show header for guest pages and user pages (not admin pages) */}
      {(!['/Accounts'].includes(location.pathname) && (!isLoggedIn || userRole === "Resident")) && (
        <header className="header">
          <div className="left">
            <img src="new-icon.png" alt="Logo" className="logo" />
            <h1>PatrolNet</h1>
          </div>
          <div className="right">
            {!isLoggedIn && (
              <>
               {/* <button className="login-btn1" onClick={() => navigate("/download")}>
                  Download App
                </button> */}
              </>
            )}
            {/* Show user profile dropdown for logged in users */}
            {isLoggedIn && (
              <UserProfileDropdown 
                user={currentUser}
                onLogout={handleLogout}
                isLoggingOut={isLoggingOut}
                onViewProfile={handleViewProfile}
              />
            )}
          </div>
        </header>
      )}

      {/* Show Sidebar for admin users - FIXED: Pass onLogout prop */}
      {shouldShowSidebar && (
        <MainSidebarWrapper 
          currentUser={currentUser} 
          onLogout={handleLogout}
        />
      )}

      {/* Main content area - adjust margin when sidebar is present */}
      <div className={shouldShowSidebar ? "main-content" : ""}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={
            !isLoggedIn && !showLogin ? 
            <Landingpage onLoginClick={() => setShowLogin(true)} /> : 
            isLoggedIn ? 
                userRole === 'Resident' ? <Navigate to="/user" replace /> :
                (userRole === 'Tanod' || userRole === 'Admintanod') ? <Navigate to="/incident-report" replace /> :
                <Navigate to="/dashboard" replace />
            : <Navigate to="/" replace />
          } />
          <Route path="/about" element={<About />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/download" element={<Download />} />

          {/* User routes (for Tanod and Resident) */}
          <Route path="/user" element={isResident() ? <User onLogout={handleLogout} /> : <Navigate to="/" replace />} />

          {/* Admin-only routes */}
          <Route path="/dashboard" element={isAdmin() ? <Dashboard /> : <Navigate to="/" replace />} />
          <Route path="/admin-activities" element={isAdmin() ? <AdminActivities /> : <Navigate to="/" replace />} />
          <Route path="/admin-announcements" element={isAdmin() ? <AdminAnnouncements /> : <Navigate to="/" replace />} />
          <Route path="/messages" element={isAdmin() ? <Messages /> : <Navigate to="/" replace />} />
          <Route path="/tourist-spots" element={isAdmin() ? <TouristSpots /> : <Navigate to="/" replace />} />
          <Route path="/firewall" element={<Firewall />} />

          {/* Shared routes (Tanod + Admin access) */}
          <Route path="/incident-report" element={isTanodOrAdmin() ? <IncidentReport /> : <Navigate to="/" replace />} />
          <Route path="/scheduling" element={isTanodOrAdmin() ? <ScheduleAssignment /> : <Navigate to="/" replace />} />
          <Route path="/patrol-logs" element={isTanodOrAdmin() ? <PatrolLogs /> : <Navigate to="/" replace />} />
          <Route path="/accounts" element={isTanodOrAdmin() ? <Accounts /> : <Navigate to="/" replace />} />
          <Route path="/gis-mapping" element={isTanodOrAdmin() ? <GISMapping /> : <Navigate to="/" replace />} />
          <Route path="/attendance" element={isTanodOrAdmin() ? <Attendance /> : <Navigate to="/" replace />} />

          {/* Catch-all route for unmatched paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Show Login form (kept as conditional rendering) */}
        {showLogin && (
          <Login setShowLogin={setShowLogin} onLoginSuccess={handleLoginSuccess} />
        )}
      </div>
    </div>
  );
}

// Main App component with Router wrapper
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
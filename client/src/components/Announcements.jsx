import React, { useState, useEffect } from 'react';
import GISMapping from "./GISmapping";
import CommunityHub from './CommunityHub';
import { BASE_URL } from '../config';

export default function AnnouncementPage({ showEmergencyContacts = true, showCommunityHub = true }) {
  const [recentIncident, setRecentIncident] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [selectedStat, setSelectedStat] = useState(null);
  const [expandedContact, setExpandedContact] = useState(null);
  const [hoveredIncidentType, setHoveredIncidentType] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/incidents`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const prevCount = incidents.length;
        setIncidents(data);
        
        if (data.length > prevCount && prevCount > 0) {
          setNotification('New incident reported!');
          setTimeout(() => setNotification(null), 3000);
        }
        
        if (data.length > 0) {
          const sortedIncidents = data.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
          setRecentIncident(sortedIncidents[0]);
        }
      } catch (error) {
        console.error("Error fetching incidents:", error);
      }
    };

    fetchIncidents();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchIncidents, 30000);
    return () => clearInterval(interval);
  }, [incidents.length]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${BASE_URL}/api/incidents`);
      if (response.ok) {
        const data = await response.json();
        setIncidents(data);
        if (data.length > 0) {
          const sortedIncidents = data.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
          setRecentIncident(sortedIncidents[0]);
        }
      }
    } catch (error) {
      console.error("Error refreshing:", error);
    }
    setTimeout(() => setRefreshing(false), 500);
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getIncidentsByType = () => {
    const types = {};
    incidents.forEach(incident => {
      const type = incident.incident_type || 'Other';
      types[type] = (types[type] || 0) + 1;
    });
    return types;
  };

  const getRiskLevel = () => {
    const activeIncidents = incidents.filter(i => i.status === 'active').length;
    if (activeIncidents >= 5) return { level: 'High', color: '#ef4444' };
    if (activeIncidents >= 2) return { level: 'Moderate', color: '#f59e0b' };
    return { level: 'Low', color: '#10b981' };
  };

  const handleCall = (number) => {
    window.location.href = `tel:${number}`;
  };

  const riskLevel = incidents.length >= 3 ? { level: "High", color: "#ef4444" } : { level: "Low", color: "#10b981" };
  const incidentTypes = getIncidentsByType();
  const maxCount = Math.max(...Object.values(incidentTypes), 1);

  return (
    <div style={styles.page}>
      {/* Notification Toast */}
      {notification && (
        <div style={{
          ...styles.notification,
          animation: 'slideInDown 0.3s ease-out',
        }}>
          🔔 {notification}
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.container}>
          <h1 style={styles.title}>Community Safety Dashboard</h1>
          <p style={styles.subtitle}>Real-time incident monitoring and community updates</p>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.container}>
          <div style={styles.mainGrid}>
            {/* Map Section */}
            <div style={styles.mapSection}>
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h2 style={styles.cardTitle}>Live Incident Map</h2>
                  <div style={styles.headerActions}>
                    <button 
                      onClick={handleRefresh}
                      style={{
                        ...styles.refreshButton,
                        transform: refreshing ? 'rotate(360deg)' : 'rotate(0deg)',
                      }}
                      disabled={refreshing}
                      onMouseEnter={(e) => !refreshing && (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      ↻
                    </button>
                    <div style={styles.liveIndicator}>
                      <div style={styles.liveDot}></div>
                      <span style={styles.liveText}>Live</span>
                    </div>
                  </div>
                </div>
                <div style={styles.mapContainer}>
                  <GISMapping showOnlyMap={true} />
                </div>
                <div style={styles.mapStats}>
                  <div 
                    style={{
                      ...styles.statItem,
                      transform: selectedStat === 'total' ? 'scale(1.05)' : 'scale(1)',
                      cursor: 'pointer',
                      padding: '12px',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                    }}
                    onClick={() => setSelectedStat(selectedStat === 'total' ? null : 'total')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{
                      ...styles.statNumber,
                      color: selectedStat === 'total' ? '#2563eb' : '#111827',
                    }}>{incidents.length}</span>
                    <span style={styles.statLabel}>Total Incidents</span>
                  </div>
                  <div style={styles.statDivider}></div>
                  <div 
                    style={{
                      ...styles.statItem,
                      transform: selectedStat === 'active' ? 'scale(1.05)' : 'scale(1)',
                      cursor: 'pointer',
                      padding: '12px',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                    }}
                    onClick={() => setSelectedStat(selectedStat === 'active' ? null : 'active')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{
                      ...styles.statNumber,
                      color: selectedStat === 'active' ? '#ef4444' : '#111827',
                    }}>{incidents.filter(i => i.status === 'active').length}</span>
                    <span style={styles.statLabel}>Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div style={styles.infoSection}>
              {/* Risk Level */}
              <div style={{
                ...styles.card,
                transition: 'all 0.3s ease',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>Risk Level</h3>
                </div>
                <div style={styles.riskContent}>
                  <div style={{
                    ...styles.riskBadge, 
                    backgroundColor: riskLevel.color,
                    animation: 'pulse 2s ease-in-out infinite',
                  }}>
                    {riskLevel.level}
                  </div>
                  <p style={styles.riskDetail}>
                    {incidents.filter(i => i.status === 'active').length} active incidents
                  </p>
                </div>
              </div>

              {/* Latest Incident */}
              {recentIncident && (
                <div style={{
                  ...styles.card,
                  transition: 'all 0.3s ease',
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>Latest Incident</h3>
                    <span style={styles.newBadge}>NEW</span>
                  </div>
                  <div style={styles.incidentContent}>
                    <div style={styles.incidentHeader}>
                      <span style={styles.incidentType}>{recentIncident.incident_type}</span>
                      <span style={{...styles.statusBadge, ...styles[recentIncident.status]}}>
                        {recentIncident.status}
                      </span>
                    </div>
                    <p style={styles.incidentTime}>⏰ {formatDate(recentIncident.datetime)}</p>
                    <p style={styles.incidentDescription}>{recentIncident.description}</p>
                    <p style={styles.responseTime}>⚡ Response time: {recentIncident.responsetime}</p>
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div style={{
                ...styles.card,
                transition: 'all 0.3s ease',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>Incident Types</h3>
                </div>
                <div style={styles.statsContent}>
                  {Object.entries(incidentTypes).map(([type, count]) => {
                    const percentage = (count / maxCount) * 100;
                    const isHovered = hoveredIncidentType === type;
                    
                    return (
                      <div 
                        key={type} 
                        style={{
                          ...styles.statRow,
                          backgroundColor: isHovered ? '#f9fafb' : 'transparent',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          padding: '12px 8px',
                          borderRadius: '6px',
                          marginBottom: '8px',
                        }}
                        onMouseEnter={() => setHoveredIncidentType(type)}
                        onMouseLeave={() => setHoveredIncidentType(null)}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={styles.statType}>{type}</span>
                            <span style={{
                              ...styles.statCount,
                              color: isHovered ? '#2563eb' : '#111827',
                            }}>{count}</span>
                          </div>
                          <div style={styles.progressBar}>
                            <div style={{
                              ...styles.progressFill,
                              width: `${percentage}%`,
                              transition: 'width 0.5s ease',
                            }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Emergency Contacts */}
              {showEmergencyContacts && (
                <div style={{
                  ...styles.card,
                  transition: 'all 0.3s ease',
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>🚨 Emergency Contacts</h3>
                  </div>
                  <div style={styles.contactsContent}>
                    {[
                      { name: 'Emergency Services', number: '911', icon: '🚑' },
                      { name: 'Local Emergency', number: '(02) 8888-0911', icon: '📞' },
                      { name: 'Disaster Response', number: '(02) 911-1406', icon: '🆘' }
                    ].map((contact) => (
                      <div 
                        key={contact.number}
                        style={{
                          ...styles.contactItem,
                          backgroundColor: expandedContact === contact.number ? '#eff6ff' : '#f9fafb',
                          transform: expandedContact === contact.number ? 'scale(1.02)' : 'scale(1)',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                        }}
                        onClick={() => setExpandedContact(expandedContact === contact.number ? null : contact.number)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '24px' }}>{contact.icon}</span>
                          <div>
                            <div style={styles.contactName}>{contact.name}</div>
                            <div style={styles.contactNumber}>{contact.number}</div>
                          </div>
                        </div>
                        <button 
                          style={{
                            ...styles.callButton,
                            transform: 'scale(1)',
                            transition: 'all 0.2s ease',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCall(contact.number);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.backgroundColor = '#1d4ed8';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.backgroundColor = '#2563eb';
                          }}
                        >
                          📱 Call
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Community Hub */}
      {showCommunityHub && (
        <div style={styles.communityWrapper}>
          <div style={styles.communityContainer}>
            <CommunityHub formatDate={formatDate} />
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '40px 0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
  },
  mainContent: {
    flex: '1',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
    padding: '40px 0',
  },
  mapSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  refreshButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '2px solid #e5e7eb',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    color: '#6b7280',
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  liveDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#ef4444',
    borderRadius: '50%',
    animation: 'pulse 2s infinite',
  },
  liveText: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500',
  },
  mapContainer: {
    height: '400px',
    marginBottom: '16px',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  mapStats: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.3s ease',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    transition: 'color 0.3s ease',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  statDivider: {
    width: '1px',
    backgroundColor: '#e5e7eb',
  },
  riskContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 0',
  },
  riskBadge: {
    padding: '12px 32px',
    borderRadius: '8px',
    color: 'white',
    fontSize: '20px',
    fontWeight: '700',
    transition: 'all 0.3s ease',
  },
  riskDetail: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  newBadge: {
    padding: '4px 8px',
    backgroundColor: '#ef4444',
    color: 'white',
    fontSize: '10px',
    fontWeight: '700',
    borderRadius: '4px',
    animation: 'pulse 2s infinite',
  },
  incidentContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  incidentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incidentType: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  active: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  resolved: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  incidentTime: {
    fontSize: '13px',
    color: '#6b7280',
    margin: 0,
  },
  incidentDescription: {
    fontSize: '14px',
    color: '#374151',
    margin: 0,
    lineHeight: '1.5',
  },
  responseTime: {
    fontSize: '13px',
    color: '#6b7280',
    margin: 0,
  },
  statsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statRow: {
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #f3f4f6',
  },
  statType: {
    fontSize: '14px',
    color: '#374151',
  },
  statCount: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    transition: 'color 0.2s ease',
  },
  progressBar: {
    width: '100%',
    height: '4px',
    backgroundColor: '#e5e7eb',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: '2px',
  },
  contactsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  contactItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  contactName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '4px',
  },
  contactNumber: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
  },
  callButton: {
    padding: '10px 20px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  notification: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '16px 24px',
    borderRadius: '8px',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
    zIndex: 1000,
    fontWeight: '500',
  },
  communityWrapper: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e5e7eb',
    marginTop: '60px',
    paddingTop: '60px',
    paddingBottom: '60px',
  },
  communityContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    position: 'relative',
    zIndex: 1,
  },
};

// Add keyframes for animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes slideInDown {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @media (max-width: 768px) {
    div[style*="gridTemplateColumns: 2fr 1fr"] {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(styleSheet);
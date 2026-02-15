import React, { useState, useEffect, useRef } from 'react';
import { Clock, LogIn, LogOut, Calendar, User, ArrowDown, Loader, MapPin, Camera, Video } from 'lucide-react';
import { BASE_URL } from '../config';

const Attendance = () => {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const [logsResponse, usersResponse] = await Promise.all([
          fetch(`${BASE_URL}/api/logs`),
          fetch(`${BASE_URL}/api/users`),
        ]);

        if (!logsResponse.ok) throw new Error('Failed to fetch logs');
        if (!usersResponse.ok) throw new Error('Failed to fetch users');

        const logsData = await logsResponse.json();
        const usersData = await usersResponse.json();

        const usersMap = usersData.reduce((acc, user) => {
          acc[user.USER] = user;
          return acc;
        }, {});
        setUsers(usersMap);

        const sortedLogs = logsData.sort((a, b) => new Date(a.TIME) - new Date(b.TIME));
        setLogs(sortedLogs);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getUserImage = (username) => {
    const user = users[username];
    if (user && user.IMAGE) {
      return `${BASE_URL}/uploads/${user.IMAGE}`;
    }
    return '/defprof1.png';
  };

  const groupLogsByDate = (logs) => {
    const grouped = {};
    logs.forEach(log => {
      const date = new Date(log.TIME).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(log);
    });
    return grouped;
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isVideoFile = (filename) => {
    if (!filename) return false;
    const lower = String(filename).toLowerCase();
    return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.m4v') || lower.endsWith('.webm');
  };

  const groupedLogs = groupLogsByDate(logs);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#f0f2f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e4e6eb',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#0084ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff'
        }}>
          <Calendar size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#050505' }}>
            Attendance Logs
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#65676b' }}>
            {logs.length} total entries • Live Feed
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '20px',
            color: '#65676b'
          }}>
            <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Loading logs...</span>
          </div>
        ) : error ? (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#fee',
            color: '#c00',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            Error: {error}
          </div>
        ) : Object.keys(groupedLogs).length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#65676b'
          }}>
            No logs found
          </div>
        ) : (
          Object.entries(groupedLogs).map(([date, logsOnDate]) => (
            <React.Fragment key={date}>
              {/* Date Separator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '16px 0 8px',
                gap: '12px'
              }}>
                <div style={{
                  flex: 1,
                  height: '1px',
                  backgroundColor: '#e4e6eb'
                }} />
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#65676b',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  {date}
                </span>
                <div style={{
                  flex: 1,
                  height: '1px',
                  backgroundColor: '#e4e6eb'
                }} />
              </div>

              {/* Log Messages */}
              {logsOnDate.map((log) => {
                const hasTimeIn = log.TIME_IN && !log.TIME_OUT;
                const hasTimeOut = log.TIME_OUT;
                const isClockIn = hasTimeIn;
                
                return (
                  <div key={log.ID} style={{
                    display: 'flex',
                    gap: '10px',
                    maxWidth: '85%',
                    alignSelf: log.ID % 2 === 0 ? 'flex-start' : 'flex-start'
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      flexShrink: 0,
                      backgroundColor: '#e4e6eb'
                    }}>
                      {getUserImage(log.USER) ? (
                        <img 
                          src={getUserImage(log.USER)} 
                          alt={log.USER}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => e.target.src = '/defprof1.png'}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#65676b'
                        }}>
                          <User size={20} />
                        </div>
                      )}
                    </div>

                    {/* Message Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Username */}
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#050505',
                        marginBottom: '4px',
                        paddingLeft: '4px'
                      }}>
                        {log.USER}
                      </div>

                      {/* Message Bubble */}
                      <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '18px',
                        padding: '12px 16px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        border: `2px solid ${isClockIn ? '#4caf50' : hasTimeOut ? '#f44336' : '#e4e6eb'}`
                      }}>
                        {/* Action Header */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '8px'
                        }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: isClockIn ? '#e8f5e9' : hasTimeOut ? '#ffebee' : '#f0f2f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isClockIn ? '#4caf50' : hasTimeOut ? '#f44336' : '#65676b'
                          }}>
                            {isClockIn ? <LogIn size={14} /> : hasTimeOut ? <LogOut size={14} /> : <Clock size={14} />}
                          </div>
                          <span style={{
                            fontSize: '15px',
                            fontWeight: 600,
                            color: '#050505'
                          }}>
                            {log.ACTION || (isClockIn ? 'Clock In' : hasTimeOut ? 'Clock Out' : 'Log Entry')}
                          </span>
                        </div>

                        {/* Log Details */}
                        <div style={{
                          fontSize: '14px',
                          color: '#050505',
                          lineHeight: '1.5',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          {log.TIME_IN && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <LogIn size={14} style={{ color: '#4caf50' }} />
                              <span><strong>Time In:</strong> {formatTime(log.TIME_IN)}</span>
                            </div>
                          )}
                          
                          {log.TIME_OUT && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <LogOut size={14} style={{ color: '#f44336' }} />
                              <span><strong>Time Out:</strong> {formatTime(log.TIME_OUT)}</span>
                            </div>
                          )}

                          {log.LOCATION && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <MapPin size={14} style={{ color: '#2196f3' }} />
                              <span><strong>Location:</strong> {log.LOCATION}</span>
                            </div>
                          )}

                          {/* Time In Photo */}
                          {log.time_in_photo && (
                            <div style={{ marginTop: '8px' }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '6px',
                                fontSize: '13px',
                                color: '#65676b'
                              }}>
                                <Camera size={12} />
                                <span>{isVideoFile(log.time_in_photo) ? 'Clock In Video' : 'Clock In Photo'}</span>
                              </div>
                              {isVideoFile(log.time_in_photo) ? (
                                <video
                                  src={`${BASE_URL}/uploads/${log.time_in_photo}`}
                                  controls
                                  style={{
                                    width: '100%',
                                    maxWidth: '300px',
                                    borderRadius: '12px',
                                    border: '1px solid #e4e6eb'
                                  }}
                                />
                              ) : (
                                <img
                                  src={`${BASE_URL}/uploads/${log.time_in_photo}`}
                                  alt="Clock in"
                                  style={{
                                    width: '100%',
                                    maxWidth: '300px',
                                    borderRadius: '12px',
                                    border: '1px solid #e4e6eb'
                                  }}
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              )}
                            </div>
                          )}

                          {/* Time In Video */}
                          {log.time_in_video && (
                            <div style={{ marginTop: '8px' }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '6px',
                                fontSize: '13px',
                                color: '#65676b'
                              }}>
                                <Video size={12} />
                                <span>Clock In Video</span>
                              </div>
                              <video
                                src={`${BASE_URL}/uploads/${log.time_in_video}`}
                                controls
                                style={{
                                  width: '100%',
                                  maxWidth: '300px',
                                  borderRadius: '12px',
                                  border: '1px solid #e4e6eb'
                                }}
                              />
                            </div>
                          )}

                          {/* Time Out Photo */}
                          {log.time_out_photo && (
                            <div style={{ marginTop: '8px' }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '6px',
                                fontSize: '13px',
                                color: '#65676b'
                              }}>
                                <Camera size={12} />
                                <span>{isVideoFile(log.time_out_photo) ? 'Clock Out Video' : 'Clock Out Photo'}</span>
                              </div>
                              {isVideoFile(log.time_out_photo) ? (
                                <video
                                  src={`${BASE_URL}/uploads/${log.time_out_photo}`}
                                  controls
                                  style={{
                                    width: '100%',
                                    maxWidth: '300px',
                                    borderRadius: '12px',
                                    border: '1px solid #e4e6eb'
                                  }}
                                />
                              ) : (
                                <img
                                  src={`${BASE_URL}/uploads/${log.time_out_photo}`}
                                  alt="Clock out"
                                  style={{
                                    width: '100%',
                                    maxWidth: '300px',
                                    borderRadius: '12px',
                                    border: '1px solid #e4e6eb'
                                  }}
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              )}
                            </div>
                          )}

                          {/* Time Out Video */}
                          {log.time_out_video && (
                            <div style={{ marginTop: '8px' }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '6px',
                                fontSize: '13px',
                                color: '#65676b'
                              }}>
                                <Video size={12} />
                                <span>Clock Out Video</span>
                              </div>
                              <video
                                src={`${BASE_URL}/uploads/${log.time_out_video}`}
                                controls
                                style={{
                                  width: '100%',
                                  maxWidth: '300px',
                                  borderRadius: '12px',
                                  border: '1px solid #e4e6eb'
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div style={{
                          marginTop: '8px',
                          fontSize: '12px',
                          color: '#65676b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Clock size={11} />
                          {formatTime(log.TIME)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: '#fff',
        borderTop: '1px solid #e4e6eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          color: '#65676b'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#4caf50',
            animation: 'pulse 2s infinite'
          }} />
          <span>Real-time feed</span>
        </div>
        <button
          onClick={() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#0084ff',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          <ArrowDown size={18} />
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default Attendance;
import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Phone, Send, Paperclip, Filter, Shield, Users, MapPin, AlertTriangle, Mail, User, Clock, MessageSquare } from 'lucide-react';
import { BASE_URL } from '../config';

const Message = () => {
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [contactMessages, setContactMessages] = useState([]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/contact-messages`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Parse the replies JSON string back into an object
      const parsedData = data.map(msg => ({
        ...msg,
        replies: msg.replies ? JSON.parse(msg.replies) : []
      }));
      setContactMessages(parsedData);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const filteredMessages = contactMessages.filter(message => {
    const matchesSearch = message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || message.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const sendReply = async () => {
    if (replyMessage.trim() && selectedMessage) {
      try {
        const response = await fetch(`${BASE_URL}/api/contact-messages/${selectedMessage.id}/replies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: 'Admin', // Or dynamically get admin user
            content: replyMessage,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Reply sent:', data);
        setReplyMessage('');
        fetchMessages(); // Re-fetch messages to update the UI
      } catch (error) {
        console.error("Error sending reply:", error);
      }
    }
  };

  const markAsInProgress = async (messageId) => {
    try {
      const response = await fetch(`${BASE_URL}/api/contact-messages/${messageId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'in-progress' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Status updated:', data);
      fetchMessages(); // Re-fetch messages to update the UI
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'unread': return '#ef4444';
      case 'in-progress': return '#f59e0b';
      case 'replied': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#d97706';
      case 'low': return '#65a30d';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'complaint': return <AlertTriangle size={16} />;
      case 'information': return <MessageSquare size={16} />;
      case 'business': return <Users size={16} />;
      case 'report': return <Shield size={16} />;
      case 'safety': return <AlertTriangle size={16} />;
      case 'tip': return <MapPin size={16} />;
      default: return <Mail size={16} />;
    }
  };

  const styles = {
    container: {
      display: 'flex',
      height: '100%', // Changed from 100vh
      backgroundColor: '#f9fafb', // Kept for context
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    sidebar: {
      width: '400px',
      backgroundColor: 'white',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      padding: '20px',
      borderBottom: '1px solid #e5e7eb',
      background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
      color: 'white'
    },
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '16px'
    },
    headerTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    title: {
      fontSize: '20px',
      fontWeight: 'bold',
      margin: 0
    },
    searchContainer: {
      position: 'relative',
      marginBottom: '12px'
    },
    searchInput: {
      width: '100%',
      paddingLeft: '40px',
      paddingRight: '16px',
      paddingTop: '8px',
      paddingBottom: '8px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      color: '#111827'
    },
    searchIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9ca3af'
    },
    filterContainer: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    filterButton: {
      padding: '6px 12px',
      fontSize: '12px',
      borderRadius: '20px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      color: 'white',
      fontWeight: '500'
    },
    messageList: {
      flex: 1,
      overflowY: 'auto'
    },
    messageItem: {
      padding: '16px',
      borderBottom: '1px solid #f3f4f6',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      position: 'relative'
    },
    messageItemSelected: {
      backgroundColor: '#eff6ff',
      borderLeft: '4px solid #2563eb'
    },
    messageHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '8px'
    },
    messageName: {
      fontWeight: '600',
      color: '#111827',
      fontSize: '14px',
      margin: 0
    },
    messageTime: {
      fontSize: '12px',
      color: '#6b7280'
    },
    messageSubject: {
      fontSize: '13px',
      color: '#374151',
      fontWeight: '500',
      marginBottom: '4px',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    },
    messagePreview: {
      fontSize: '12px',
      color: '#6b7280',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      lineHeight: '1.4',
      marginBottom: '8px'
    },
    messageFooter: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    statusBadge: {
      padding: '2px 8px',
      fontSize: '11px',
      borderRadius: '12px',
      fontWeight: '500',
      textTransform: 'uppercase'
    },
    priorityBadge: {
      padding: '2px 6px',
      fontSize: '10px',
      borderRadius: '8px',
      fontWeight: '600',
      textTransform: 'uppercase',
      color: 'white'
    },
    categoryBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 6px',
      fontSize: '11px',
      backgroundColor: '#f3f4f6',
      color: '#374151',
      borderRadius: '6px'
    },
    mainArea: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column'
    },
    chatHeader: {
      padding: '20px',
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    chatHeaderLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    avatar: {
      width: '48px',
      height: '48px',
      borderRadius: '24px',
      backgroundColor: '#3b82f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '18px'
    },
    chatHeaderInfo: {
      display: 'flex',
      flexDirection: 'column'
    },
    chatName: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#111827',
      margin: 0,
      marginBottom: '2px'
    },
    chatMeta: {
      fontSize: '13px',
      color: '#6b7280',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    actionButtons: {
      display: 'flex',
      gap: '8px'
    },
    actionButton: {
      padding: '8px',
      border: 'none',
      backgroundColor: 'transparent',
      borderRadius: '6px',
      cursor: 'pointer',
      color: '#6b7280',
      transition: 'background-color 0.2s'
    },
    messageContent: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px',
      backgroundColor: '#f9fafb'
    },
    originalMessage: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      marginBottom: '20px'
    },
    messageDetails: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '16px',
      fontSize: '13px'
    },
    messageDetail: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: '#6b7280'
    },
    messageBody: {
      fontSize: '14px',
      lineHeight: '1.6',
      color: '#374151'
    },
    repliesSection: {
      marginTop: '20px'
    },
    repliesTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#111827',
      marginBottom: '12px'
    },
    replyItem: {
      display: 'flex',
      marginBottom: '16px'
    },
    replyContent: {
      maxWidth: '70%',
      padding: '12px 16px',
      borderRadius: '16px',
      fontSize: '14px',
      lineHeight: '1.5'
    },
    replyReceived: {
      backgroundColor: 'white',
      color: '#374151',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
      alignSelf: 'flex-start'
    },
    replySent: {
      backgroundColor: '#2563eb',
      color: 'white',
      alignSelf: 'flex-end',
      marginLeft: 'auto'
    },
    replyTime: {
      fontSize: '11px',
      opacity: 0.7,
      marginTop: '4px'
    },
    replyInput: {
      padding: '16px 20px',
      backgroundColor: 'white',
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'flex-end',
      gap: '12px'
    },
    replyTextarea: {
      flex: 1,
      padding: '12px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      resize: 'none',
      outline: 'none',
      fontSize: '14px',
      minHeight: '44px'
    },
    sendButton: {
      padding: '12px 16px',
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.2s'
    },
    emptyState: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb'
    },
    emptyStateContent: {
      textAlign: 'center'
    },
    emptyStateIcon: {
      width: '64px',
      height: '64px',
      backgroundColor: '#dbeafe',
      borderRadius: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px',
      color: '#2563eb'
    },
    emptyStateTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827',
      marginBottom: '8px'
    },
    emptyStateText: {
      color: '#6b7280',
      maxWidth: '400px',
      lineHeight: '1.6'
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar - Contact Messages */}
      <div style={styles.sidebar}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerTitle}>
              <Mail size={24} />
              <h1 style={styles.title}>Contact Messages</h1>
            </div>
            <Filter size={20} style={{ cursor: 'pointer' }} />
          </div>
          
          {/* Search */}
          <div style={styles.searchContainer}>
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {/* Filter buttons */}
          <div style={styles.filterContainer}>
            {['all', 'unread', 'in-progress', 'replied'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  ...styles.filterButton,
                  backgroundColor: filterStatus === status ? '#1e40af' : '#374151',
                  opacity: filterStatus === status ? 1 : 0.8
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Message List */}
        <div style={styles.messageList}>
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              onClick={() => setSelectedMessage(message)}
              style={{
                ...styles.messageItem,
                ...(selectedMessage?.id === message.id ? styles.messageItemSelected : {}),
                backgroundColor: selectedMessage?.id === message.id ? '#eff6ff' : 
                               message.status === 'unread' ? '#fefcf7' : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (selectedMessage?.id !== message.id) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedMessage?.id !== message.id) {
                  e.currentTarget.style.backgroundColor = message.status === 'unread' ? '#fefcf7' : 'transparent';
                }
              }}
            >
              <div style={styles.messageHeader}>
                <h3 style={styles.messageName}>{message.name}</h3>
                <span style={styles.messageTime}>{message.timestamp}</span>
              </div>
              
              <div style={styles.messageSubject}>{message.subject}</div>
              <div style={styles.messagePreview}>{message.message}</div>
              
              <div style={styles.messageFooter}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: `${getStatusColor(message.status)}20`,
                      color: getStatusColor(message.status)
                    }}
                  >
                    {message.status}
                  </span>
                  <span
                    style={{
                      ...styles.priorityBadge,
                      backgroundColor: getPriorityColor(message.priority)
                    }}
                  >
                    {message.priority}
                  </span>
                </div>
                <div style={styles.categoryBadge}>
                  {getCategoryIcon(message.category)}
                  <span>{message.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={styles.mainArea}>
        {selectedMessage ? (
          <>
            {/* Header */}
            <div style={styles.chatHeader}>
              <div style={styles.chatHeaderLeft}>
                <div style={styles.avatar}>
                  {selectedMessage.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div style={styles.chatHeaderInfo}>
                  <h2 style={styles.chatName}>{selectedMessage.name}</h2>
                  <div style={styles.chatMeta}>
                    <Mail size={12} />
                    <span>{selectedMessage.email}</span>
                    <Phone size={12} />
                    <span>{selectedMessage.phone}</span>
                  </div>
                </div>
              </div>
              
              <div style={styles.actionButtons}>
                <button 
                  style={styles.actionButton}
                  onClick={() => markAsInProgress(selectedMessage.id)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Clock size={18} />
                </button>
                <button 
                  style={styles.actionButton}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Phone size={18} />
                </button>
                <button 
                  style={styles.actionButton}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Message Content */}
            <div style={styles.messageContent}>
              {/* Original Message */}
              <div style={styles.originalMessage}>
                <div style={styles.messageDetails}>
                  <div style={styles.messageDetail}>
                    <User size={14} />
                    <span><strong>From:</strong> {selectedMessage.name}</span>
                  </div>
                  <div style={styles.messageDetail}>
                    <Mail size={14} />
                    <span><strong>Email:</strong> {selectedMessage.email}</span>
                  </div>
                  <div style={styles.messageDetail}>
                    <Phone size={14} />
                    <span><strong>Phone:</strong> {selectedMessage.phone}</span>
                  </div>
                  <div style={styles.messageDetail}>
                    <Clock size={14} />
                    <span><strong>Received:</strong> {selectedMessage.timestamp}</span>
                  </div>
                </div>
                <div><strong>Subject:</strong> {selectedMessage.subject}</div>
                <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                <div style={styles.messageBody}>{selectedMessage.message}</div>
              </div>

              {/* Replies */}
              {selectedMessage.replies.length > 0 && (
                <div style={styles.repliesSection}>
                  <h3 style={styles.repliesTitle}>Replies</h3>
                  {selectedMessage.replies.map((reply) => (
                    <div key={reply.id} style={styles.replyItem}>
                      <div style={{
                        ...styles.replyContent,
                        ...(reply.sent ? styles.replySent : styles.replyReceived)
                      }}>
                        <div>{reply.content}</div>
                        <div style={styles.replyTime}>{reply.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reply Input */}
            <div style={styles.replyInput}>
              <button 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#f3f4f6'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                <Paperclip size={18} />
              </button>
              
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply..."
                style={styles.replyTextarea}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendReply();
                  }
                }}
              />
              
              <button
                onClick={sendReply}
                disabled={!replyMessage.trim()}
                style={{
                  ...styles.sendButton,
                  backgroundColor: !replyMessage.trim() ? '#d1d5db' : '#2563eb',
                  cursor: !replyMessage.trim() ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (replyMessage.trim()) {
                    e.currentTarget.style.backgroundColor = '#1d4ed8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (replyMessage.trim()) {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                  }
                }}
              >
                <Send size={16} />
                Send Reply
              </button>
            </div>
          </>
        ) : (
          // Empty state
          <div style={styles.emptyState}>
            <div style={styles.emptyStateContent}>
              <div style={styles.emptyStateIcon}>
                <Mail size={32} />
              </div>
              <h3 style={styles.emptyStateTitle}>Admin Message Center</h3>
              <p style={styles.emptyStateText}>
                Select a contact message from the sidebar to view and respond to citizen inquiries, 
                reports, and feedback from your community website.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
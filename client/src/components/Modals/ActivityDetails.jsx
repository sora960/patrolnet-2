import React from 'react';
import { BASE_URL } from '../../config'; // Import BASE_URL
import { User, Clock, MapPin, Info, CheckCircle, Printer } from 'lucide-react'; // Import icons

function ActivityDetailsModal({ isOpen, onClose, activity }) {
  if (!isOpen || !activity) {
    return null;
  }

  // Helper to format date and time
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateTimeString).toLocaleString(undefined, options);
  };

  // Helper to get status color
  const getStatusClass = (status) => {
    if (!status) return 'status-default';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('resolved') || statusLower.includes('completed')) {
      return 'status-success';
    } else if (statusLower.includes('progress') || statusLower.includes('pending')) {
      return 'status-warning';
    }
    return 'status-default';
  };

  const resolutionImageUrl = activity.resolutionImage ? `${BASE_URL}/uploads/resolutions/${activity.resolutionImage}` : null;


  const handlePrint = () => {
    window.print();
  };

  
  return (
    <div style={modalOverlayStyles} onClick={onClose}>
      <div style={modalContentStyles} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyles}>
          <div style={modalHeaderContentStyles}>
            <div style={modalIconWrapperStyles}>
              <Info size={24} />
            </div>
            <div>
              <h2 style={modalTitleStyles}>Activity Details</h2>
              <p style={modalSubtitleStyles}>Log ID: #{activity.displayId}</p>
            </div>
          </div>
          <button onClick={onClose} style={closeBtnStyles}>&times;</button>
        </div>
        
        <div style={modalBodyStyles}>
          <div style={detailsGridStyles}>
            {/* Activity Action */}
            <div style={detailItemStyles}>
              <Info size={16} style={detailIconStyles} />
              <div>
                <span style={detailLabelStyles}>Activity</span>
                <span style={detailValueStyles}>{activity.action || 'No action specified'}</span>
              </div>
            </div>

            {/* User */}
            <div style={detailItemStyles}>
              <User size={16} style={detailIconStyles} />
              <div>
                <span style={detailLabelStyles}>User</span>
                <span style={detailValueStyles}>{activity.tanod || 'N/A'}</span>
              </div>
            </div>

            {/* Time */}
            <div style={detailItemStyles}>
              <Clock size={16} style={detailIconStyles} />
              <div>
                <span style={detailLabelStyles}>Time</span>
                <span style={detailValueStyles}>{formatDateTime(activity.time)}</span>
              </div>
            </div>

            {/* Location */}
            <div style={detailItemStyles}>
              <MapPin size={16} style={detailIconStyles} />
              <div>
                <span style={detailLabelStyles}>Location</span>
                <span style={detailValueStyles}>{activity.location || 'Not specified'}</span>
              </div>
            </div>

            {/* Status */}
            <div style={detailItemStyles}>
              <CheckCircle size={16} style={detailIconStyles} />
              <div>
                <span style={detailLabelStyles}>Status</span>
                <span style={{...detailValueStyles, ...statusBadgeStyles}} className={getStatusClass(activity.status)}>
                  {activity.status || 'Pending'}
                </span>
              </div>
            </div>

            {/* Resolved By */}
            {activity.resolvedBy && (
              <div style={detailItemStyles}>
                <User size={16} style={detailIconStyles} />
                <div>
                  <span style={detailLabelStyles}>Resolved By</span>
                  <span style={detailValueStyles}>{activity.resolvedBy}</span>
                </div>
              </div>
            )}

            {/* Resolved At */}
            {activity.resolvedAt && (
              <div style={detailItemStyles}>
                <Clock size={16} style={detailIconStyles} />
                <div>
                  <span style={detailLabelStyles}>Resolved At</span>
                  <span style={detailValueStyles}>{formatDateTime(activity.resolvedAt)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Resolution Proof (photo or video) */}
          {resolutionImageUrl && (
            <div style={imageSectionStyles}>
              <span style={detailLabelStyles}>Resolution Proof</span>
              <div style={imageContainerStyles}>
                {/\.(mp4|mov|m4v|webm|3gp|mkv|avi)$/i.test(activity.resolutionImage || '') ? (
                  <video src={resolutionImageUrl} style={imageStyles} controls playsInline />
                ) : (
                  <img src={resolutionImageUrl} alt="Resolution Proof" style={imageStyles} />
                )}
              </div>
            </div>
          )}
        </div>
        
        <div style={modalFooterStyles}>
          <button onClick={handlePrint} style={printBtnStyles}>
            <Printer size={16} />
            Print
          </button>
          <button onClick={onClose} style={modalCloseBtnStyles}>Close</button>
        </div>
      </div>
      <style>{`
        .status-success { background-color: #dcfce7; color: #166534; border-color: #86efac; }
        .status-warning { background-color: #fef9c3; color: #854d0e; border-color: #fde047; }
        .status-default { background-color: #f3f4f6; color: #374151; border-color: #d1d5db; }
      `}</style>
    </div>
  );
}

// Modern CSS-in-JS Styles
const modalOverlayStyles = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(17, 24, 39, 0.6)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px',
  animation: 'fadeIn 0.3s ease-out'
};

const modalContentStyles = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  maxWidth: '600px',
  width: '100%',
  maxHeight: '90vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  animation: 'slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
};

const modalHeaderStyles = {
  padding: '24px 28px 20px 28px',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const modalHeaderContentStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const modalIconWrapperStyles = {
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalTitleStyles = {
  margin: 0,
  fontSize: '20px',
  fontWeight: '700',
  color: '#111827'
};

const modalSubtitleStyles = {
  margin: '4px 0 0 0',
  fontSize: '14px',
  color: '#6b7280',
};

const closeBtnStyles = {
  background: '#f3f4f6',
  border: 'none',
  borderRadius: '8px',
  color: '#6b7280',
  fontSize: '24px',
  width: '36px',
  height: '36px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  ':hover': {
    background: '#e5e7eb',
    transform: 'scale(1.05)'
  }
};

const modalBodyStyles = {
  padding: '28px',
  overflowY: 'auto',
  flex: 1,
  background: '#f9fafb',
};

const detailsGridStyles = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '24px',
};

const detailItemStyles = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
};

const detailIconStyles = {
  color: '#667eea',
  marginTop: '4px',
  flexShrink: 0,
};

const detailLabelStyles = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  marginBottom: '4px',
};

const detailValueStyles = {
  fontSize: '16px',
  color: '#1f2937',
  fontWeight: '500',
};

const statusBadgeStyles = {
  padding: '4px 12px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: '600',
  display: 'inline-block',
  border: '1px solid',
};

const imageSectionStyles = {
  marginTop: '24px',
  paddingTop: '24px',
  borderTop: '1px solid #e5e7eb',
};

const imageContainerStyles = {
  marginTop: '8px',
  width: '100%',
  maxHeight: '300px',
  borderRadius: '12px',
  overflow: 'hidden',
  border: '1px solid #e5e7eb',
};

const imageStyles = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const modalFooterStyles = {
  padding: '20px 28px 28px 28px',
  borderTop: '1px solid #e5e7eb',
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
  backgroundColor: '#ffffff'
};

const printBtnStyles = {
  backgroundColor: '#667eea',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  padding: '12px 20px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
  ':hover': {
    backgroundColor: '#5a67d8',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(102, 126, 234, 0.3)'
  }
};

const modalCloseBtnStyles = {
  backgroundColor: '#6b7280',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  padding: '12px 24px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  ':hover': {
    backgroundColor: '#4b5563',
    transform: 'translateY(-2px)'
  }
};

// Add keyframe animations via a style tag
const styleElement = document.createElement('style');
styleElement.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideIn {
    from { 
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  button:hover {
    transform: translateY(-1px);
  }
`;
document.head.appendChild(styleElement);

export default ActivityDetailsModal;
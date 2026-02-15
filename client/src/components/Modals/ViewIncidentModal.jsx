import React from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { BASE_URL } from '../../config';
import './ViewIncidentModal.css';

// Fix for default markers in react-leaflet which can sometimes break
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


function ViewIncidentModal({ 
  showModal, 
  selectedIncident, 
  currentUser,
  onClose, 
  onMarkAsResolved, 
  onAssignTanod 
}) {
  if (!showModal || !selectedIncident) return null;

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return 'status-resolved';
      case 'in progress':
      case 'ongoing':
        return 'status-progress';
      case 'pending':
      case 'new':
        return 'status-pending';
      default:
        return '';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'priority-high';
      case 'medium':
      case 'normal':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  const hasCoordinates = () => {
    return selectedIncident && 
           selectedIncident.latitude && 
           selectedIncident.longitude;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Incident Report - INC-${String(selectedIncident.id).padStart(6, '0')}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              line-height: 1.6;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .incident-id {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .info-row {
              display: contents;
            }
            .info-field {
              margin-bottom: 15px;
            }
            .label {
              font-weight: bold;
              color: #374151;
              margin-bottom: 5px;
            }
            .value {
              padding: 8px;
              background-color: #f9fafb;
              border-radius: 4px;
              border: 1px solid #e5e7eb;
            }
            .status-resolved { color: #059669; font-weight: bold; }
            .status-progress { color: #d97706; font-weight: bold; }
            .status-pending { color: #dc2626; font-weight: bold; }
            .priority-high { color: #dc2626; font-weight: bold; }
            .priority-medium { color: #d97706; font-weight: bold; }
            .priority-low { color: #059669; font-weight: bold; }
            .description {
              grid-column: 1 / -1;
              margin-top: 10px;
            }
            .description .value {
              min-height: 60px;
              white-space: pre-wrap;
            }
            .image-section {
              grid-column: 1 / -1;
              margin-top: 20px;
            }
            .image-section img {
              max-width: 400px;
              max-height: 300px;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
              padding-top: 15px;
            }
            @media print {
              body { margin: 0; }
              .header { page-break-after: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Incident Report</h1>
            <div class="incident-id">INC-${String(selectedIncident.id).padStart(6, '0')}</div>
          </div>
          
          <div class="info-grid">
            <div class="info-field">
              <div class="label">Status:</div>
              <div class="value ${getStatusClass(selectedIncident.status)}">${selectedIncident.status || 'Unknown'}</div>
            </div>
            <div class="info-field">
              <div class="label">Priority:</div>
              <div class="value ${getPriorityClass(selectedIncident.priority)}">${selectedIncident.priority || 'Normal'}</div>
            </div>
            
            <div class="info-field">
              <div class="label">Incident Type:</div>
              <div class="value">${selectedIncident.incident_type || 'Not specified'}</div>
            </div>
            <div class="info-field">
              <div class="label">Location:</div>
              <div class="value">${selectedIncident.location || 'Not specified'}</div>
            </div>
            
            <div class="info-field">
              <div class="label">Reported By:</div>
              <div class="value">${selectedIncident.reported_by || 'Anonymous'}</div>
            </div>
            <div class="info-field">
              <div class="label">Reported Time:</div>
              <div class="value">${formatDateTime(selectedIncident.datetime)}</div>
            </div>
            
            ${selectedIncident.assigned_tanod ? `
              <div class="info-field">
                <div class="label">Assigned Tanod:</div>
                <div class="value">${selectedIncident.assigned_tanod}</div>
              </div>
            ` : ''}
            
            ${selectedIncident.resolved_at ? `
              <div class="info-field">
                <div class="label">Resolved Time:</div>
                <div class="value">${formatDateTime(selectedIncident.resolved_at)}</div>
              </div>
            ` : ''}
            
            ${selectedIncident.resolved_by ? `
              <div class="info-field">
                <div class="label">Resolved By:</div>
                <div class="value">${selectedIncident.resolved_by}</div>
              </div>
            ` : ''}
            
            ${selectedIncident.description ? `
              <div class="description">
                <div class="info-field">
                  <div class="label">Description:</div>
                  <div class="value">${selectedIncident.description}</div>
                </div>
              </div>
            ` : ''}
            
            ${selectedIncident.notes ? `
              <div class="description">
                <div class="info-field">
                  <div class="label">Additional Notes:</div>
                  <div class="value">${selectedIncident.notes}</div>
                </div>
              </div>
            ` : ''}
            
            ${selectedIncident.image ? `
              <div class="image-section">
                <div class="info-field">
                  <div class="label">Evidence Photo:</div>
                  <div class="value">
                    <img src="${BASE_URL}/uploads/${selectedIncident.image}" alt="Incident evidence" onerror="this.style.display='none'; this.parentNode.innerHTML='<div>Evidence photo not available for printing</div>';" />
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
          
          <div class="footer">
            Generated on: ${new Date().toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}<br>
            Last updated: ${formatDateTime(selectedIncident.updated_at || selectedIncident.datetime)}
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleImageClick = (imageSrc) => {
    const imageOverlay = document.createElement('div');
    imageOverlay.className = 'image-viewer-overlay';
    
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = 'Incident Evidence - Full Size';
    
    imageOverlay.appendChild(img);
    imageOverlay.onclick = () => {
      document.body.removeChild(imageOverlay);
    };
    
    // Add escape key listener
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(imageOverlay);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    document.body.appendChild(imageOverlay);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not available';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const isResolved = selectedIncident.status?.toLowerCase() === 'resolved';

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>Incident Report Details</h2>
          <div className="header-actions">
            <button 
              className="btn print-btn" 
              onClick={handlePrint}
              aria-label="Print incident report"
              title="Print Report"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zM5 14a1 1 0 001 1h8a1 1 0 001-1v-3H5v3z" clipRule="evenodd" />
              </svg>
              Print
            </button>
            <button 
              className="modal-close" 
              onClick={onClose} 
              aria-label="Close modal"
              title="Close (Esc)"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="modal-info-grid">
            {/* Basic Information Row */}
            <div className="modal-info-row">
              <div className="modal-field">
                <label>Incident ID</label>
                <div className="modal-value incident-id">
                  INC-{String(selectedIncident.id).padStart(6, '0')}
                </div>
              </div>
              <div className="modal-field">
                <label>Status</label>
                <div className={`modal-value ${getStatusClass(selectedIncident.status)}`}>
                  {selectedIncident.status || 'Unknown'}
                </div>
              </div>
            </div>

            {/* Type and Priority Row */}
            <div className="modal-info-row">
              <div className="modal-field">
                <label>Incident Type</label>
                <div className="modal-value">
                  {selectedIncident.incident_type || 'Not specified'}
                </div>
              </div>
              <div className="modal-field">
                <label>Priority</label>
                <div className={`modal-value ${getPriorityClass(selectedIncident.priority)}`}>
                  {selectedIncident.priority || 'Normal'}
                </div>
              </div>
            </div>

            {/* Location and Reporter Row */}
            <div className="modal-info-row">
              <div className="modal-field">
                <label>Location</label>
                <div className="modal-value">
                  {selectedIncident.location || "Not specified"}
                </div>
              </div>
              <div className="modal-field">
                <label>Reported By</label>
                <div className="modal-value">
                  {selectedIncident.reported_by || "Anonymous"}
                </div>
              </div>
            </div>

            {/* Timestamps Row */}
            <div className="modal-info-row">
              <div className="modal-field">
                <label>Reported Time</label>
                <div className="modal-value timestamp">
                  {formatDateTime(selectedIncident.datetime)}
                </div>
              </div>
              {selectedIncident.resolved_at && (
                <div className="modal-field">
                  <label>Resolved Time</label>
                  <div className="modal-value timestamp">
                    {formatDateTime(selectedIncident.resolved_at)}
                  </div>
                </div>
              )}
            </div>

            {/* Assignment Information */}
            {(selectedIncident.assigned_tanod || selectedIncident.resolved_by) && (
              <div className="modal-info-row">
                {selectedIncident.assigned_tanod && (
                  <div className="modal-field">
                    <label>Assigned Tanod</label>
                    <div className="modal-value">
                      {selectedIncident.assigned_tanod}
                    </div>
                  </div>
                )}
                {selectedIncident.resolved_by && (
                  <div className="modal-field">
                    <label>Resolved By</label>
                    <div className="modal-value">
                      {selectedIncident.resolved_by}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Map Section */}
            {hasCoordinates() && (
              <div className="modal-info-row single-column">
                <div className="modal-field">
                  <label>Incident Map</label>
                  <div className="modal-map-container">
                    <MapContainer 
                      center={[parseFloat(selectedIncident.latitude), parseFloat(selectedIncident.longitude)]} 
                      zoom={16} 
                      style={{ height: '250px', width: '100%', borderRadius: '8px' }}
                      key={selectedIncident.id} /* Add key to force re-render on incident change */
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <Marker position={[parseFloat(selectedIncident.latitude), parseFloat(selectedIncident.longitude)]}>
                        <Popup>
                          {selectedIncident.location}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              </div>
            )}
            {/* Description */}
            {selectedIncident.description && (
              <div className="modal-info-row single-column">
                <div className="modal-field">
                  <label>Description</label>
                  <div className="modal-description">
                    {selectedIncident.description}
                  </div>
                </div>
              </div>
            )}

            {/* Evidence Photo */}
            {selectedIncident.image && (
              <div className="modal-info-row single-column">
                <div className="modal-field">
                  <label>Evidence Photo</label>
                  <div className="modal-image-container">
                    <img 
                      src={`${BASE_URL}/uploads/${selectedIncident.image}`} 
                      alt="Incident evidence" 
                      className="modal-image"
                      onClick={() => handleImageClick(`${BASE_URL}/uploads/${selectedIncident.image}`)}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = '<div class="image-placeholder">Evidence photo not available</div>';
                      }}
                      title="Click to view full size"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Resolution Image Proof */}
            {selectedIncident.resolution_image_path && (
              <div className="modal-info-row single-column">
                <div className="modal-field">
                  <label>Resolution Proof</label>
                  <div className="modal-image-container">
                    {/\.(mp4|mov|m4v|webm|3gp|mkv|avi)$/i.test(selectedIncident.resolution_image_path) ? (
                      <video
                        src={`${BASE_URL}/uploads/resolutions/${selectedIncident.resolution_image_path}`}
                        className="modal-image"
                        controls
                        playsInline
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = '<div class="image-placeholder">Resolution video not available</div>';
                        }}
                      />
                    ) : (
                      <img
                        src={`${BASE_URL}/uploads/resolutions/${selectedIncident.resolution_image_path}`}
                        alt="Resolution proof"
                        className="modal-image"
                        onClick={() => handleImageClick(`${BASE_URL}/uploads/resolutions/${selectedIncident.resolution_image_path}`)}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = '<div class="image-placeholder">Resolution photo not available</div>';
                        }}
                        title="Click to view full size"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Additional Notes */}
            {selectedIncident.notes && (
              <div className="modal-info-row single-column">
                <div className="modal-field">
                  <label>Additional Notes</label>
                  <div className="modal-description">
                    {selectedIncident.notes}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div style={{ marginRight: 'auto', fontSize: '12px', color: '#6b7280' }}>
            Last updated: {formatDateTime(selectedIncident.updated_at || selectedIncident.datetime)}
          </div>
          
          {!isResolved && (
            <>
              <button 
                className="btn resolve-btn" 
                onClick={onMarkAsResolved}
                aria-label="Mark incident as resolved"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Mark as Resolved
              </button>
              <button 
                className="btn secondary" 
                onClick={onAssignTanod}
                aria-label="Assign tanod to incident"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                Assign Tanod
              </button>
            </>
          )}
          <button 
            className="btn close" 
            onClick={onClose}
            aria-label="Close modal"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ViewIncidentModal;
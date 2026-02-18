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

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // ✅ OFFICIAL PRINT FUNCTION
  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=800,width=1000');
    
    // Official LGU HTML Template
    const printHtml = `
      <html>
        <head>
          <title>Incident Report - ${selectedIncident.id}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: "Times New Roman", Times, serif; padding: 20px; color: #111827; line-height: 1.6; }
            .official-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .republic { text-transform: uppercase; font-size: 14px; margin: 0; letter-spacing: 1px; }
            .province { font-size: 14px; margin: 0; }
            .barangay { font-size: 24px; font-weight: bold; margin: 5px 0; color: #b91c1c; }
            .document-title { font-size: 16px; font-weight: bold; margin-top: 10px; text-decoration: underline; }
            
            .section { margin-top: 25px; }
            .section-title { font-weight: bold; text-transform: uppercase; background: #f3f4f6; padding: 5px 10px; font-size: 13px; border: 1px solid #000; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 10px; }
            .label { font-weight: bold; color: #374151; }
            .value { border-bottom: 1px dashed #ccc; }
            
            .resolution-card { margin-top: 20px; border: 2px solid #059669; padding: 15px; background-color: #f0fdf4; }

            .signature-row { display: flex; justify-content: space-around; margin-top: 60px; }
            .sig-block { text-align: center; width: 250px; }
            .sig-line { border-bottom: 1px solid #000; margin-bottom: 5px; }
            .sig-name { font-weight: bold; text-transform: uppercase; }
            .sig-title { font-size: 12px; }

            .footer-note { text-align: center; font-size: 10px; margin-top: 50px; font-style: italic; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="official-header">
            <p class="republic">Republic of the Philippines</p>
            <p class="province">Province of Quezon | Municipality of Real</p>
            <h1 class="barangay">BARANGAY TIGNOAN</h1>
            <h2 class="document-title">OFFICIAL INCIDENT REPORT</h2>
          </div>

          <div class="section">
            <div class="section-title">Incident Details</div>
            <div class="grid">
              <div><span class="label">Incident ID:</span> <span class="value">INC-${String(selectedIncident.id).padStart(6, '0')}</span></div>
              <div><span class="label">Type:</span> <span class="value">${selectedIncident.incident_type}</span></div>
              <div><span class="label">Date/Time:</span> <span class="value">${formatDateTime(selectedIncident.datetime)}</span></div>
              <div><span class="label">Status:</span> <span class="value">${selectedIncident.status}</span></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Location & Handler</div>
            <div class="grid">
              <div style="grid-column: span 2;"><span class="label">Location:</span> <span class="value">${selectedIncident.location}</span></div>
              <div><span class="label">Assigned Officer:</span> <span class="value">${selectedIncident.assigned_tanod || 'Unassigned'}</span></div>
              <div><span class="label">Reporter:</span> <span class="value">Identity Protected (Anonymous)</span></div>
            </div>
          </div>

          ${selectedIncident.description ? `
          <div class="section">
            <div class="section-title">Description</div>
            <div style="padding: 10px; border: 1px solid #eee;">${selectedIncident.description}</div>
          </div>
          ` : ''}

          ${selectedIncident.status === 'Resolved' ? `
            <div class="resolution-card">
              <div style="font-weight: bold; text-decoration: underline; margin-bottom: 10px;">OFFICIAL RESOLUTION</div>
              <div><strong>Resolved By:</strong> ${selectedIncident.resolved_by || 'Admin'}</div>
              <div><strong>Date Resolved:</strong> ${formatDateTime(selectedIncident.resolved_at)}</div>
              <div><strong>Evidence:</strong> Verified and on file.</div>
            </div>
          ` : ''}

          <div class="signature-row">
            <div class="sig-block">
              <div class="sig-line"></div>
              <div class="sig-name">Barangay Duty Officer</div>
              <div class="sig-title">Prepared By</div>
            </div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <div class="sig-name">Punong Barangay</div>
              <div class="sig-title">Attested By</div>
            </div>
          </div>

          <p class="footer-note">Generated by PatrolNet System. This document is official and valid without a wet seal if verified online.</p>
        </body>
      </html>
    `;

    printWindow.document.write(printHtml);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return 'status-resolved';
      case 'in progress': case 'ongoing': return 'status-progress';
      case 'pending': case 'new': return 'status-pending';
      default: return '';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': case 'critical': return 'priority-high';
      case 'medium': case 'normal': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  const hasCoordinates = () => {
    return selectedIncident && selectedIncident.latitude && selectedIncident.longitude;
  };

  const handleImageClick = (imageSrc) => {
    const imageOverlay = document.createElement('div');
    imageOverlay.className = 'image-viewer-overlay';
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = 'Incident Evidence - Full Size';
    imageOverlay.appendChild(img);
    imageOverlay.onclick = () => document.body.removeChild(imageOverlay);
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(imageOverlay);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    document.body.appendChild(imageOverlay);
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

            {/* Location and Reported Time Row */}
            <div className="modal-info-row">
              <div className="modal-field">
                <label>Location</label>
                <div className="modal-value">
                  {selectedIncident.location || "Not specified"}
                </div>
              </div>
              <div className="modal-field">
                <label>Reported Time</label>
                <div className="modal-value timestamp">
                  {formatDateTime(selectedIncident.datetime)}
                </div>
              </div>
            </div>

            {/* Assigned Tanod Row (Only shows if someone is assigned) */}
            {selectedIncident.assigned_tanod && (
              <div className="modal-info-row single-column">
                <div className="modal-field">
                  <label>Assigned Tanod</label>
                  <div className="modal-value">
                    {selectedIncident.assigned_tanod}
                  </div>
                </div>
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
                      key={selectedIncident.id}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <Marker position={[parseFloat(selectedIncident.latitude), parseFloat(selectedIncident.longitude)]}>
                        <Popup>{selectedIncident.location}</Popup>
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

            {/* RESOLUTION DETAILS CARD */}
            {isResolved && (
              <div className="resolution-card">
                <div className="resolution-card-header">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <h3>Official Resolution Details</h3>
                </div>
                
                <div className="modal-info-row">
                  <div className="modal-field">
                    <label>Resolved By</label>
                    <div className="modal-value highlight-success">
                      {selectedIncident.resolved_by || 'Unknown'}
                    </div>
                  </div>
                  <div className="modal-field">
                    <label>Date & Time Resolved</label>
                    <div className="modal-value timestamp">
                      {formatDateTime(selectedIncident.resolved_at)}
                    </div>
                  </div>
                </div>

                {selectedIncident.resolution_image_path ? (
                  <div className="modal-info-row single-column" style={{ marginTop: '16px' }}>
                    <div className="modal-field">
                      <label>Attached Proof of Resolution</label>
                      <div className="modal-image-container success-border">
                        {/\.(mp4|mov|m4v|webm|3gp|mkv|avi)$/i.test(selectedIncident.resolution_image_path) ? (
                          <video
                            src={`${BASE_URL}/uploads/resolutions/${selectedIncident.resolution_image_path}`}
                            className="modal-image"
                            controls
                            playsInline
                            style={{ border: '3px solid #10b981' }}
                          />
                        ) : (
                          <img
                            src={`${BASE_URL}/uploads/resolutions/${selectedIncident.resolution_image_path}`}
                            alt="Resolution proof"
                            className="modal-image"
                            style={{ border: '3px solid #10b981' }}
                            onClick={() => handleImageClick(`${BASE_URL}/uploads/resolutions/${selectedIncident.resolution_image_path}`)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-proof-warning">
                    ⚠️ No photo or video proof was attached to this resolution.
                  </div>
                )}
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
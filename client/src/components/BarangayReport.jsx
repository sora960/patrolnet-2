import React, { useRef } from 'react';
import { FileText, Download, X } from 'lucide-react';
import { BASE_URL } from '../config';

const BarangayReport = ({ incident, onClose }) => {
  const reportRef = useRef();

  const formatDateTime = (dt) => {
    const date = new Date(dt);
    return date.toLocaleDateString('en-PH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=800,width=1000');
    
    // We build the HTML from scratch to ensure total control over branding
    const printHtml = `
      <html>
        <head>
          <title>Barangay Tignoan - Official Report</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { 
              font-family: "Times New Roman", Times, serif; 
              padding: 20px; 
              color: #111827; 
              line-height: 1.6; 
            }
            /* Official Header */
            .official-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .republic { text-transform: uppercase; font-size: 14px; margin: 0; letter-spacing: 1px; }
            .province { font-size: 14px; margin: 0; }
            .barangay { font-size: 24px; font-weight: bold; margin: 5px 0; color: #b91c1c; }
            .document-title { font-size: 16px; font-weight: bold; margin-top: 10px; text-decoration: underline; }

            /* Content Sections */
            .section { margin-top: 25px; }
            .section-title { 
              font-weight: bold; 
              text-transform: uppercase; 
              background: #f3f4f6; 
              padding: 5px 10px; 
              font-size: 13px; 
              border: 1px solid #000;
            }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 10px; }
            .label { font-weight: bold; color: #374151; }
            .value { border-bottom: 1px dashed #ccc; }

            /* Resolution Card */
            .resolution-card { 
              margin-top: 20px; 
              border: 2px solid #059669; 
              padding: 15px; 
              background-color: #f0fdf4;
            }

            /* Signatures */
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
            <div class="section-title">Case Information</div>
            <div class="grid">
              <div><span class="label">Incident ID:</span> <span class="value">INC-${String(incident.id).padStart(6, '0')}</span></div>
              <div><span class="label">Nature of Incident:</span> <span class="value">${incident.incident_type}</span></div>
              <div><span class="label">Date/Time Reported:</span> <span class="value">${formatDateTime(incident.datetime)}</span></div>
              <div><span class="label">Current Status:</span> <span class="value">${incident.status}</span></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Location & Personnel</div>
            <div class="grid">
              <div style="grid-column: span 2;"><span class="label">Exact Location:</span> <span class="value">${incident.location}</span></div>
              <div><span class="label">Assigned Tanod:</span> <span class="value">${incident.assigned || 'Unassigned'}</span></div>
              <div><span class="label">Reporter:</span> <span class="value">Identity Protected (Anonymous)</span></div>
            </div>
          </div>

          ${incident.status === 'Resolved' ? `
            <div class="resolution-card">
              <div style="font-weight: bold; text-decoration: underline; margin-bottom: 10px;">RESOLUTION LOG</div>
              <div><strong>Resolved By:</strong> ${incident.resolved_by}</div>
              <div><strong>Date Resolved:</strong> ${formatDateTime(incident.resolved_at)}</div>
              <div><strong>Verification:</strong> Photo proof submitted and verified by Admin.</div>
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

          

          <p class="footer-note">This document is electronically generated by PatrolNet. Any unauthorized alteration renders this report null and void.</p>
        </body>
      </html>
    `;

    printWindow.document.write(printHtml);
    printWindow.document.close();
    
    // Give the window a split second to render fonts before printing
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/incidents/${incident.id}`);
      const data = await response.json();
      
      // Create a simple text-based report
      const reportContent = `
REPUBLIC OF THE PHILIPPINES
BARANGAY TIGNOAN
OFFICIAL INCIDENT REPORT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REPORT DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Incident ID: ${data.id}
Incident Type: ${data.incident_type || 'N/A'}
Status: ${data.status || 'N/A'}
Date & Time: ${formatDateTime(data.datetime)}

Location Details:
├─ Address: ${data.location || 'N/A'}
├─ Latitude: ${data.latitude ? parseFloat(data.latitude).toFixed(6) : 'N/A'}
└─ Longitude: ${data.longitude ? parseFloat(data.longitude).toFixed(6) : 'N/A'}

Incident Handler:
├─ Assigned Officer: ${data.assigned || 'Unassigned'}
└─ Status: ${data.status === 'Resolved' ? '✅ RESOLVED' : '⏳ PENDING'}

${data.status === 'Resolved' ? `
Resolution Information:
├─ Resolved By: ${data.resolved_by || 'System'}
├─ Resolution Date: ${formatDateTime(data.resolved_at)}
└─ Proof of Resolution: ${data.resolution_image_path ? 'YES - Image Evidence Available' : 'Documentation on file'}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Report Generated: ${formatDateTime(new Date())}
Document Type: Official Barangay Incident Report
Privacy Status: Reporter identity protected (Anonymous)

For inquiries regarding this report, please contact:
Barangay Tignoan Administrative Office
Emergency Hotline: 911

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an official document of Barangay Tignoan.
`;

      // Create a Blob and download
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Incident_${data.id}_Report_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading report:', err);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
      overflow: 'auto', padding: '1rem'
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', width: '100%', maxWidth: '800px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.5rem', borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={24} color="#dc2626" />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
                Official Incident Report
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                Barangay Tignoan
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px'
          }}>
            <X size={20} color="#6b7280" />
          </button>
        </div>

        {/* Content */}
        <div ref={reportRef} style={{
          padding: '2rem', flex: 1, overflowY: 'auto',
          fontFamily: 'Courier New, monospace', fontSize: '0.875rem', lineHeight: '1.6'
        }}>
          {/* Official Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #111827' }}>
            <h1 style={{ margin: '0.5rem 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '1px' }}>
              REPUBLIC OF THE PHILIPPINES
            </h1>
            <h2 style={{ margin: '0.25rem 0 0.5rem 0', fontSize: '1rem', fontWeight: 700, color: '#dc2626' }}>
              BARANGAY TIGNOAN
            </h2>
            <h3 style={{ margin: '0.5rem 0', fontSize: '0.9rem', fontWeight: 600 }}>
              OFFICIAL INCIDENT REPORT
            </h3>
          </div>

          {/* Report Details */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid #d1d5db', paddingBottom: '0.25rem' }}>
              INCIDENT INFORMATION
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div>
                <div style={{ color: '#6b7280', fontWeight: 600 }}>Incident ID:</div>
                <div style={{ color: '#111827' }}>{incident.id}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontWeight: 600 }}>Incident Type:</div>
                <div style={{ color: '#111827' }}>{incident.incident_type || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontWeight: 600 }}>Date & Time:</div>
                <div style={{ color: '#111827' }}>{formatDateTime(incident.datetime)}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontWeight: 600 }}>Status:</div>
                <div style={{ color: incident.status === 'Resolved' ? '#059669' : '#dc2626', fontWeight: 700 }}>
                  {incident.status === 'Resolved' ? '✅ RESOLVED' : '⏳ ' + (incident.status || 'PENDING')}
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid #d1d5db', paddingBottom: '0.25rem' }}>
              LOCATION DETAILS
            </h4>
            <div style={{ fontSize: '0.85rem' }}>
              <div style={{ marginBottom: '0.25rem' }}>
                <span style={{ color: '#6b7280', fontWeight: 600 }}>📍 Address:</span> {incident.location || 'N/A'}
              </div>
              <div style={{ marginBottom: '0.25rem' }}>
                <span style={{ color: '#6b7280', fontWeight: 600 }}>📐 Coordinates:</span> {incident.latitude ? parseFloat(incident.latitude).toFixed(6) : 'N/A'}, {incident.longitude ? parseFloat(incident.longitude).toFixed(6) : 'N/A'}
              </div>
            </div>
          </div>

          {/* Assignment & Handler */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid #d1d5db', paddingBottom: '0.25rem' }}>
              HANDLER INFORMATION
            </h4>
            <div style={{ fontSize: '0.85rem' }}>
              <div style={{ marginBottom: '0.25rem' }}>
                <span style={{ color: '#6b7280', fontWeight: 600 }}>Assigned Officer:</span> {incident.assigned || 'Unassigned'}
              </div>
              <div style={{ marginBottom: '0.25rem' }}>
                <span style={{ color: '#6b7280', fontWeight: 600 }}>Reporter:</span> Anonymous (Identity Protected)
              </div>
            </div>
          </div>

          {/* Resolution (if applicable) */}
          {incident.status === 'Resolved' && (
            <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: '#ecfdf5', borderLeft: '3px solid #059669' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 600, textTransform: 'uppercase', color: '#059669' }}>
                ✅ RESOLUTION DETAILS
              </h4>
              <div style={{ fontSize: '0.85rem' }}>
                <div style={{ marginBottom: '0.25rem' }}>
                  <span style={{ color: '#6b7280', fontWeight: 600 }}>Resolved By:</span> {incident.resolved_by || 'System'}
                </div>
                <div style={{ marginBottom: '0.25rem' }}>
                  <span style={{ color: '#6b7280', fontWeight: 600 }}>Resolution Date:</span> {formatDateTime(incident.resolved_at)}
                </div>
                <div style={{ marginBottom: '0.25rem' }}>
                  <span style={{ color: '#6b7280', fontWeight: 600 }}>Proof of Resolution:</span> {incident.resolution_image_path ? '✓ Evidence Available' : 'Documentation on file'}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{
            marginTop: '2rem', paddingTop: '1rem', borderTop: '2px solid #111827',
            textAlign: 'center', fontSize: '0.75rem', color: '#6b7280'
          }}>
            <p style={{ margin: '0.5rem 0' }}>
              Generated: {formatDateTime(new Date())}
            </p>
            <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>
              This is an official document of Barangay Tignoan
            </p>
            <p style={{ margin: '0.5rem 0' }}>
              For inquiries: Barangay Tignoan Administrative Office | Emergency: 911
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex', gap: '0.75rem', padding: '1.5rem',
          borderTop: '1px solid #e5e7eb', justifyContent: 'flex-end'
        }}>
          <button onClick={onClose} style={{
            padding: '0.625rem 1.25rem', borderRadius: '8px', border: '1px solid #d1d5db',
            background: 'white', fontWeight: 500, cursor: 'pointer'
          }}>
            Close
          </button>
          <button onClick={handleDownload} style={{
            padding: '0.625rem 1.25rem', borderRadius: '8px', border: 'none',
            background: 'linear-gradient(135deg, #059669, #047857)', color: 'white',
            fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <Download size={16} /> Download
          </button>
          <button onClick={handlePrint} style={{
            padding: '0.625rem 1.25rem', borderRadius: '8px', border: 'none',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white',
            fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <FileText size={16} /> Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarangayReport;


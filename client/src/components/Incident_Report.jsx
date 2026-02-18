// IncidentReport.jsx
import React, { useMemo, useState, useEffect } from "react";
import ViewIncidentModal from "./Modals/ViewIncidentModal";
import AssignTanodModal from "./Modals/Tanodmodal";
import LocationModal from "./LocationModal";
import ConfirmationModal from "./Modals/ConfirmationModal";
import { BASE_URL } from "../config";
import "./IncidentReport.css";

function IncidentReport() {
  const [incidents, setIncidents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupBy, setGroupBy] = useState("month");
  
  // NEW: Active Tab State
  const [activeTab, setActiveTab] = useState("active"); // 'active' or 'history'

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableTanods, setAvailableTanods] = useState([]);
  const [selectedTanod, setSelectedTanod] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationIncident, setLocationIncident] = useState(null);
  const [currentUser, setCurrentUser] = useState("");

  const getStatusColor = (status) => {
    switch (status) {
      case "Under Review": return "status-yellow";
      case "In Progress": return "status-blue";
      case "Resolved": return "status-green";
      default: return "";
    }
  };

  const getIncidentDate = (incident) => {
    const raw = incident?.datetime || incident?.created_at;
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatMonthYear = (date) =>
    date.toLocaleString(undefined, { month: "long", year: "numeric" });

  // Filter Logic Updated for Tabs
  const filteredIncidents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const data = Array.isArray(incidents) ? incidents : [];

    // 1. Sort by Date (Newest First)
    const sorted = [...data].sort((a, b) => {
      const da = getIncidentDate(a);
      const db = getIncidentDate(b);
      return (db?.getTime() || 0) - (da?.getTime() || 0);
    });

    // 2. Filter by Tab (Active vs History)
    const tabFiltered = sorted.filter(item => {
      const isFinished = item.status === "Resolved" || item.status === "Dismissed";
      if (activeTab === "active") return !isFinished; // Show Under Review, In Progress
      if (activeTab === "history") return isFinished; // Show Resolved
      return true;
    });

    // 3. Filter by Search Term
    return tabFiltered.filter((item) => {
      if (!q) return true;
      const date = getIncidentDate(item);
      const haystack = [
        item?.id,
        item?.incident_type,
        item?.location,
        item?.status,
        item?.resolved_by,
        date ? date.toLocaleString() : "",
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [incidents, searchTerm, activeTab]);

  const groupedIncidents = useMemo(() => {
    if (groupBy === "none") {
      return [{ key: "All", title: "All Incidents", items: filteredIncidents }];
    }

    const map = new Map();
    for (const item of filteredIncidents) {
      const date = getIncidentDate(item);
      let key = "Unknown";
      let title = "Unknown Date";

      if (date) {
        if (groupBy === "year") {
          key = String(date.getFullYear());
          title = key;
        } else {
          const y = date.getFullYear();
          const m = date.getMonth() + 1;
          key = `${y}-${String(m).padStart(2, "0")}`;
          title = formatMonthYear(date);
        }
      }

      if (!map.has(key)) map.set(key, { key, title, items: [] });
      map.get(key).items.push(item);
    }

    // Sort groups (e.g. Feb 2026 before Jan 2026)
    return Array.from(map.values()).sort((a, b) => (b.key > a.key ? 1 : -1));
  }, [filteredIncidents, groupBy]);

  useEffect(() => {
    setCurrentUser(localStorage.getItem("currentUser") || "Admin");
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000); // Auto-refresh
    return () => clearInterval(interval);
  }, []);

  const fetchIncidents = () => {
    fetch(`${BASE_URL}/api/incidents`)
      .then((res) => res.json())
      .then((data) => setIncidents(data))
      .catch((err) => console.error("Failed to fetch incidents:", err));
  };

  const fetchAvailableTanods = () => {
    const today = new Date().toISOString().slice(0, 10);
    fetch(`${BASE_URL}/api/logs`)
      .then((res) => res.json())
      .then((data) => {
        // Simple logic: users who timed in today
        const onlineUsers = data
          .filter(log => log.TIME?.startsWith(today) && log.TIME_IN && !log.TIME_OUT)
          .map(log => ({ USER: log.USER, ID: log.ID }));
        
        // Remove duplicates
        const unique = [...new Map(onlineUsers.map(v => [v.USER, v])).values()];
        setAvailableTanods(unique);
      })
      .catch((err) => console.error("Failed to fetch tanods:", err));
  };

  const handleViewClick = (incident) => { setSelectedIncident(incident); setShowViewModal(true); };
  const handleAssignTanodClick = (incident) => { setSelectedIncident(incident); fetchAvailableTanods(); setShowAssignModal(true); };
  const handleLocationClick = (incident) => { setLocationIncident(incident); setShowLocationModal(true); };
  const closeViewModal = () => { setShowViewModal(false); setSelectedIncident(null); };
  const closeAssignModal = () => { setShowAssignModal(false); setSelectedIncident(null); setSelectedTanod(""); };
  const openConfirmationModal = () => setShowConfirmation(true);
  const closeConfirmationModal = () => setShowConfirmation(false);

  const handleAssignTanod = async () => {
    if (!selectedIncident || !selectedTanod) return alert("Select a tanod.");
    setIsUpdating(true);
    try {
      const res = await fetch(`${BASE_URL}/api/incidents/${selectedIncident.id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tanod_id: selectedTanod }),
      });
      if (res.ok) {
        fetchIncidents(); // Refresh list immediately
        closeAssignModal();
        alert("Tanod assigned!");
      } else alert("Failed to assign.");
    } catch (err) { alert("Error assigning."); }
    finally { setIsUpdating(false); }
  };

  const handleMarkAsResolved = async () => {
    if (!selectedIncident) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`${BASE_URL}/api/incidents/${selectedIncident.id}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved_by: currentUser }),
      });
      if (res.ok) {
        fetchIncidents(); // Refresh list immediately
        setShowConfirmation(false);
        setSelectedIncident(null);
        alert("Incident Resolved!");
      } else alert("Failed to resolve.");
    } catch (err) { alert("Error resolving."); }
    finally { setIsUpdating(false); }
  };


  // Add this inside the IncidentReport component, before the return statement
const printSummary = useMemo(() => {
  const counts = filteredIncidents.reduce((acc, item) => {
    const type = item.incident_type || "N/A";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  return {
    total: filteredIncidents.length,
    types: Object.entries(counts)
  };
}, [filteredIncidents]);




  return (
    <div className="dashboard">
      <div style={{ width: '100%', margin: '0 auto' }}>
        
        {/* Header */}
        <div className="hide-on-print" style={{ backgroundColor: '#ffffff', padding: '1.5rem 2rem', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
              🚨 Incident Reports
            </h1>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              Manage active cases and view historical records.
            </p>
          </div>
        </div>

        <div className="incident-container" style={{ padding: "2rem", maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* TABS SWITCHER */}
          <div className="incident-tabs">
            <button 
              className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              Active Cases
            </button>
            <button 
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Resolution History
            </button>
          </div>

          {/* Controls */}
          <div className="incident-controls">
            <div className="incident-controls-left">
              <button type="button" className="btn view-btn" onClick={() => window.print()}>
                Print Report
              </button>
              <div className="incident-groupby">
                <label>Group by</label>
                <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
            <input
              type="text"
              placeholder="Search ID, Type, Location..."
              className="incident-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* List */}
          <div className="incident-list-wrapper">
            {filteredIncidents.length === 0 ? (
              <div className="no-data" style={{ padding: 30 }}>
                {activeTab === 'active' ? "No active incidents pending." : "No historical records found."}
              </div>
            ) : (
              groupedIncidents.map((group) => (
                <section key={group.key} className="incident-group">
                  <div className="incident-group-header">
                    <h3 className="incident-group-title">{group.title}</h3>
                    <div className="incident-group-count">{group.items.length} record(s)</div>
                  </div>
                  <div className="incident-card-list">
                    {group.items.map((item) => {
                      const date = getIncidentDate(item);
                      return (
                        <div key={item.id} className="incident-card">
                          <div className="incident-card-media">
                            {item.image ? (
                              <img src={`${BASE_URL}/uploads/${item.image}`} className="incident-card-image" alt="Evidence" />
                            ) : (
                              <div className="incident-card-image incident-card-image--placeholder">No Image</div>
                            )}
                          </div>
                          <div className="incident-card-body">
                            <div className="incident-card-top">
                              <div className="incident-card-id">#{item.id}</div>
                              <span className={`status-badge ${getStatusColor(item.status)}`}>{item.status}</span>
                            </div>
                            <div className="incident-card-row">
                              <span className="type-badge">{item.incident_type}</span>
                              <span className="incident-card-date">{date?.toLocaleString()}</span>
                            </div>
                            <div className="incident-card-meta">
                              <div><strong>Location:</strong> <span className="location-cell" onClick={() => handleLocationClick(item)}>{item.location}</span></div>
                              {item.resolved_by && (
                                <div style={{color: '#059669', fontSize: '12px', marginTop: '4px'}}>
                                  <strong>✓ Resolved by:</strong> {item.resolved_by}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="incident-card-actions">
                            <button className="btn view-btn" onClick={() => handleViewClick(item)}>View Details</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))
            )}
          </div>

          {/* ✅ ENHANCED: Professional Official Print Layout */}
          <div className="incident-print-list" aria-hidden="true">
            
            {/* OFFICIAL BARANGAY LETTERHEAD WITH LOGO HOLDERS */}
            <div className="incident-print-header">
              <div className="header-logos-row">
                <div className="print-logo-placeholder">PH SEAL</div>
                <div className="official-letterhead">
                  <p className="republic-text">Republic of the Philippines</p>
                  <p className="province-text">Province of Quezon</p>
                  <p className="municipality-text">Municipality of Real</p>
                  <h2 className="barangay-text">BARANGAY TIGNOAN</h2>
                  <h3 className="office-text">OFFICE OF THE BARANGAY TANOD / PATROL</h3>
                </div>
                <div className="print-logo-placeholder">BGY SEAL</div>
              </div>
              
              <div className="report-title-section">
                    <h1 className="main-report-title">OFFICIAL INCIDENT SUMMARY REPORT</h1>
                    <h2 className="sub-report-title">{activeTab === 'active' ? 'CURRENT ACTIVE CASES' : 'RESOLUTION HISTORY LOG'}</h2>
                    <div className="incident-print-meta">Generation Date: {new Date().toLocaleString()}</div>
                  </div>
                </div>

                {/* NEW: QUICK ANALYTICS SUMMARY BOX */}
                <div className="print-analytics-box">
                  <div className="analytics-column main-stat">
                    <span className="stat-label">TOTAL RECORDS</span>
                    <span className="stat-value">{printSummary.total}</span>
                  </div>
                  <div className="analytics-column">
                    <span className="stat-label">INCIDENT BREAKDOWN</span>
                    <div className="stat-grid">
                      {printSummary.types.map(([type, count]) => (
                        <div key={type} className="stat-grid-item">
                          <strong>{type}:</strong> {count}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="analytics-column status-box">
                    <span className="stat-label">REPORT STATUS</span>
                    <span className="stat-status-badge">{activeTab === 'active' ? 'PENDING ACTION' : 'COMPLETED/ARCHIVED'}</span>
                  </div>
                </div>

            {/* OFFICIAL DATA TABLE */}
            <table className="official-table">
              <thead>
                <tr>
                  <th style={{width: '10%'}}>Case ID</th>
                  <th style={{width: '15%'}}>Type</th>
                  <th style={{width: '20%'}}>Date & Time</th>
                  <th style={{width: '25%'}}>Location</th>
                  <th style={{width: '15%'}}>Status</th>
                  {activeTab === 'history' && <th style={{width: '15%'}}>Resolved By</th>}
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'history' ? "6" : "5"} className="empty-cell">
                      No incident records found for this period.
                    </td>
                  </tr>
                ) : (
                  groupedIncidents.map((group) => (
                    <React.Fragment key={group.key}>
                      <tr className="group-header-row">
                        <td colSpan={activeTab === 'history' ? "6" : "5"}>
                          📅 {group.title} ({group.items.length} Cases)
                        </td>
                      </tr>
                      {group.items.map((item) => {
                        const date = getIncidentDate(item);
                        return (
                          <tr key={item.id}>
                            <td className="cell-id">#ID-{String(item.id).padStart(4, '0')}</td>
                            <td className="cell-type">{item.incident_type}</td>
                            <td>{date ? date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : "N/A"}</td>
                            <td className="cell-loc">{item.location}</td>
                            <td className="cell-status">{item.status}</td>
                            {activeTab === 'history' && <td className="cell-res">{item.resolved_by || 'System Admin'}</td>}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>

            {/* OFFICIAL SIGNATURE BLOCK */}
              <div className="incident-print-footer">
                <div className="signature-block">
                  <p className="signature-label">Prepared and Certified by:</p>
                  <div className="signature-line"></div>
                  <p className="signature-name">{currentUser.toUpperCase()}</p>
                  <p className="signature-title">Duty Officer / Barangay Tanod</p>
                  <p className="signature-date">Date: _________________</p>
                </div>

              <div className="signature-block">
                <p className="signature-label">Noted by:</p>
                <div className="signature-line"></div>
                <p className="signature-name">HON. BRGY. CAPTAIN</p>
                <p className="signature-title">Punong Barangay</p>
              </div>


            </div>

            
              <div className="print-footer-notice">
                <p>This is an electronically generated report from the PatrolNet System. Any unauthorized alteration renders this document invalid.</p>
              </div>
              
          </div>
        </div>
      </div>

      {/* Modals */}
      <ViewIncidentModal
        showModal={showViewModal}
        selectedIncident={selectedIncident}
        onClose={closeViewModal}
        onMarkAsResolved={openConfirmationModal}
        onAssignTanod={() => handleAssignTanodClick(selectedIncident)}
      />
      <AssignTanodModal
        showModal={showAssignModal}
        selectedIncident={selectedIncident}
        availableTanods={availableTanods}
        selectedTanod={selectedTanod}
        setSelectedTanod={setSelectedTanod}
        isUpdating={isUpdating}
        onClose={closeAssignModal}
        onAssignTanod={handleAssignTanod}
      />
      <ConfirmationModal
        showModal={showConfirmation}
        selectedIncident={selectedIncident}
        isUpdating={isUpdating}
        onClose={closeConfirmationModal}
        onConfirm={handleMarkAsResolved}
        title="Confirm Resolution"
        message="Mark this incident as resolved? You will be asked for proof."
        confirmText="Proceed"
      />
      <LocationModal
        show={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        incident={locationIncident}
      />
    </div>
  );
}

export default IncidentReport;
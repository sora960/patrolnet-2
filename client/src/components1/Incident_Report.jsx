// IncidentReport.jsx
import React, { useMemo, useState, useEffect } from "react";
import MainSidebarWrapper from "./MainSidebarWrapper";
import ViewIncidentModal from "./Modals/ViewIncidentModal";
import AssignTanodModal from "./Modals/Tanodmodal";
import ConfirmationModal from "./Modals/ConfirmationModal";
import { BASE_URL } from "../config";
import "./IncidentReport.css";

function IncidentReport() {
  const [incidents, setIncidents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupBy, setGroupBy] = useState("month");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableTanods, setAvailableTanods] = useState([]);
  const [selectedTanod, setSelectedTanod] = useState("");
  const [currentUser, setCurrentUser] = useState("");

  const getStatusColor = (status) => {
    switch (status) {
      case "Under Review":
        return "status-yellow";
      case "In Progress":
        return "status-blue";
      case "Resolved":
        return "status-green";
      default:
        return "";
    }
  };

  const getIncidentDate = (incident) => {
    const raw =
      incident?.datetime ||
      incident?.DATE_TIME ||
      incident?.created_at ||
      incident?.CREATED_AT ||
      incident?.date ||
      incident?.DATE ||
      incident?.time ||
      incident?.TIME;

    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatMonthYear = (date) =>
    date.toLocaleString(undefined, { month: "long", year: "numeric" });

  const filteredIncidents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const data = Array.isArray(incidents) ? incidents : [];

    const matches = (item) => {
      if (!q) return true;
      const date = getIncidentDate(item);
      const haystack = [
        item?.id,
        item?.incident_type,
        item?.reported_by,
        item?.location,
        item?.status,
        item?.latitude,
        item?.longitude,
        date ? date.toLocaleString() : "",
      ]
        .filter((v) => v !== undefined && v !== null)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    };

    const sorted = [...data].sort((a, b) => {
      const da = getIncidentDate(a);
      const db = getIncidentDate(b);
      if (da && db) return db.getTime() - da.getTime();
      if (da && !db) return -1;
      if (!da && db) return 1;
      return (b?.id || 0) - (a?.id || 0);
    });

    return sorted.filter(matches);
  }, [incidents, searchTerm]);

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

    const groups = Array.from(map.values());
    const keyToSort = (k) => {
      if (k === "Unknown") return -Infinity;
      if (groupBy === "year") return Number(k);
      const [y, m] = k.split("-").map((n) => Number(n));
      return y * 100 + m;
    };

    groups.sort((a, b) => keyToSort(b.key) - keyToSort(a.key));
    return groups;
  }, [filteredIncidents, groupBy]);

  // Get current user from localStorage or session
  useEffect(() => {
    const user = localStorage.getItem("currentUser") || "Admin";
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    const fetchIncidents = () => {
      fetch(`${BASE_URL}/api/incidents`)
        .then((res) => res.json())
        .then((data) => {
          setIncidents(data);
        })
        .catch((err) => {
          console.error("Failed to fetch incidents:", err);
          setIncidents([]);
        });
    };

    fetchIncidents();
    const intervalId = setInterval(fetchIncidents, 3000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchAvailableTanods = () => {
    const today = new Date().toISOString().slice(0, 10);

    fetch(`${BASE_URL}/api/logs`)
      .then((res) => res.json())
      .then((data) => {
        const todayLogs = data.filter((log) => {
          const logDate = log.TIME ? log.TIME.slice(0, 10) : null;
          return logDate === today && log.TIME_IN && !log.TIME_OUT;
        });

        const availableUsers = todayLogs.reduce((acc, log) => {
          if (!acc.find((u) => u.USER === log.USER)) {
            acc.push({
              USER: log.USER,
              TIME_IN: log.TIME_IN,
              ID: log.ID,
            });
          }
          return acc;
        }, []);

        setAvailableTanods(availableUsers);
      })
      .catch((err) => {
        console.error("Failed to fetch available tanods:", err);
        setAvailableTanods([]);
      });
  };

  const handleViewClick = (incident) => {
    setSelectedIncident(incident);
    setShowViewModal(true);
  };

  const handleAssignTanodClick = (incident) => {
    setSelectedIncident(incident);
    fetchAvailableTanods();
    setShowAssignModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedIncident(null);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedIncident(null);
    setSelectedTanod("");
    setAvailableTanods([]);
  };

  const openConfirmationModal = () => {
    setShowConfirmation(true);
  };

  const closeConfirmationModal = () => {
    setShowConfirmation(false);
  };

  // keep your existing assign/resolved handlers (omitted here for brevity)
  // ... (you can keep the rest of your existing handlers like handleAssignTanod, handleMarkAsResolved)

  const handleMarkAsResolved = async () => {
    if (!selectedIncident) return;

    setIsUpdating(true);

    try {
      const res = await fetch(`${BASE_URL}/api/incidents/${selectedIncident.id}/resolve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resolved_by: currentUser }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Update the incident in local state
        setIncidents((prev) =>
          prev.map((inc) =>
            inc.id === selectedIncident.id ? { ...inc, status: "Resolved" } : inc
          )
        );

        // Close modal and clear selection
        setShowConfirmation(false);
        setSelectedIncident(null);

        alert("Incident marked as resolved successfully");
      } else {
        const msg = data.message || `Server responded with status ${res.status}`;
        alert("Failed to mark incident as resolved: " + msg);
      }
    } catch (err) {
      console.error("Error marking incident as resolved:", err);
      alert("An error occurred while marking the incident as resolved");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="dashboard">
      <MainSidebarWrapper />

      <div className="incident-container">
        <header className="incident-header">
          <h2>
            <span className="incident-icon">🚨</span> List of Incident Report
          </h2>
          <p>Manage incident reports, assign tanods, and track resolution status</p>
        </header>

        <div className="incident-controls">
          <div className="incident-controls-left">
            <button
              type="button"
              className="btn view-btn"
              onClick={() => window.print()}
              title="Print"
            >
              Print
            </button>

            <div className="incident-groupby">
              <label htmlFor="incident-groupby-select">Group by</label>
              <select
                id="incident-groupby-select"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
              >
                <option value="month">Month</option>
                <option value="year">Year</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>

          <input
            type="text"
            placeholder="Search incidents..."
            className="incident-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="incident-list-wrapper">
          {filteredIncidents.length === 0 ? (
            <div className="no-data" style={{ padding: 16 }}>
              No incidents found.
            </div>
          ) : (
            groupedIncidents.map((group) => (
              <section key={group.key} className="incident-group">
                <div className="incident-group-header">
                  <h3 className="incident-group-title">{group.title}</h3>
                  <div className="incident-group-count">{group.items.length} incident(s)</div>
                </div>

                <div className="incident-card-list">
                  {group.items.map((item) => {
                    const date = getIncidentDate(item);
                    return (
                      <div key={item.id} className="incident-card">
                        <div className="incident-card-media">
                          {item.image ? (
                            <img
                              src={`${BASE_URL}/uploads/${item.image}`}
                              alt="Incident"
                              className="incident-card-image"
                            />
                          ) : (
                            <div className="incident-card-image incident-card-image--placeholder">No image</div>
                          )}
                        </div>

                        <div className="incident-card-body">
                          <div className="incident-card-top">
                            <div className="incident-card-id">#{item.id}</div>
                            <span className={`status-badge ${getStatusColor(item.status)}`}>{item.status || "Unknown"}</span>
                          </div>

                          <div className="incident-card-row">
                            <span className="type-badge">{item.incident_type || "N/A"}</span>
                            {date && <span className="incident-card-date">{date.toLocaleString()}</span>}
                          </div>

                          <div className="incident-card-meta">
                            <div><strong>Reported By:</strong> {item.reported_by || "Unknown"}</div>
                            <div><strong>Location:</strong> {item.location || "Not specified"}</div>
                          </div>
                        </div>

                        <div className="incident-card-actions">
                          <button className="btn view-btn" onClick={() => handleViewClick(item)}>
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        {/* Print-only non-tabular layout */}
        <div className="incident-print-list" aria-hidden="true">
          <div className="incident-print-header">
            <h1>List of Incident Report</h1>
            <div className="incident-print-meta">Printed: {new Date().toLocaleString()}</div>
          </div>

          {filteredIncidents.length === 0 ? (
            <div className="incident-print-empty">No incidents found.</div>
          ) : (
            groupedIncidents.map((group) => (
              <div key={group.key} className="incident-print-group">
                <div className="incident-print-group-title">
                  {group.title} ({group.items.length})
                </div>
                {group.items.map((item) => {
                  const date = getIncidentDate(item);
                  return (
                    <div key={item.id} className="incident-print-item">
                      <div className="incident-print-title">
                        <div className="incident-print-id">INC-{String(item.id).padStart(6, '0')}</div>
                        <div className={`incident-print-status ${getStatusColor(item.status)}`}>{item.status || 'Unknown'}</div>
                      </div>

                      <div className="incident-print-grid">
                        <div>
                          <div className="incident-print-label">Type</div>
                          <div className="incident-print-value">{item.incident_type || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="incident-print-label">Reported By</div>
                          <div className="incident-print-value">{item.reported_by || 'Unknown'}</div>
                        </div>
                        <div>
                          <div className="incident-print-label">Date/Time</div>
                          <div className="incident-print-value">{date ? date.toLocaleString() : 'N/A'}</div>
                        </div>
                        <div>
                          <div className="incident-print-label">Location / Coordinates</div>
                          <div className="incident-print-value">
                            {item.latitude && item.longitude
                              ? `${parseFloat(item.latitude).toFixed(6)}, ${parseFloat(item.longitude).toFixed(6)}`
                              : item.location || 'Not specified'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* View Modal */}
      <ViewIncidentModal
        showModal={showViewModal}
        selectedIncident={selectedIncident}
        currentUser={currentUser}
        onClose={closeViewModal}
        onMarkAsResolved={openConfirmationModal}
        onAssignTanod={() => handleAssignTanodClick(selectedIncident)}
      />

      {/* Assign Tanod Modal */}
      <AssignTanodModal
        showModal={showAssignModal}
        selectedIncident={selectedIncident}
        availableTanods={availableTanods}
        selectedTanod={selectedTanod}
        setSelectedTanod={setSelectedTanod}
        isUpdating={isUpdating}
        onClose={closeAssignModal}
        onAssignTanod={() => {
          /* your assign handler if you have it */
        }}
      />

      {/* Mark as Resolved Confirmation Modal */}
      <ConfirmationModal
        showModal={showConfirmation}
        selectedIncident={selectedIncident}
        currentUser={currentUser}
        isUpdating={isUpdating}
        onClose={closeConfirmationModal}
        onConfirm={handleMarkAsResolved}
        title="Confirm Action"
        message="Are you sure you want to mark this incident as resolved?"
        confirmText="Confirm"
        showResolvedBy={true}
      />
    </div>
  );
}

export default IncidentReport;
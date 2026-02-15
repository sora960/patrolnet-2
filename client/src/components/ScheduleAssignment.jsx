import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MainSidebarWrapper from './MainSidebarWrapper';
import EditScheduleModal from './Modals/EditScheduleModal';
import './ScheduleAssignment.css'; // Import the CSS file
import ScheduleCalendar from './ScheduleCalendar'; // Import the new calendar component
import { BASE_URL } from '../config';
import { Calendar, List } from 'lucide-react'; // Import icons

const ScheduleAssignment = () => {
  const [personnel, setPersonnel] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidencePerson, setEvidencePerson] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false); // State to toggle calendar view
  const [formData, setFormData] = useState({ status: '', location: '', day: '', start_time: '', end_time: '', month: 'All' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Base URL for your backend
  

  // Function to get image URL
  const getImageUrl = (imageName) => {
    if (!imageName) return null;
    return `${BASE_URL}/uploads/${imageName}`;
  };

  const getMediaUrl = (filename) => {
    if (!filename) return null;
    return `${BASE_URL}/uploads/${filename}`;
  };

  const hasAnyEvidence = (logs) => {
    const timeIn = logs?.timeIn;
    const timeOut = logs?.timeOut;
    return Boolean(
      timeIn?.photo ||
      timeIn?.video ||
      timeOut?.photo ||
      timeOut?.video
    );
  };

  const getUserTimeStatusPayload = async (username) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/user-time-status/${username}`);
      if (response.data && response.data.success) return response.data;
      return null;
    } catch (err) {
      console.error(`Error fetching user time status for ${username}:`, err);
      return null;
    }
  };

  // Function to get the most recent log time for display
  const getMostRecentLogTime = async (username) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/logs/${username}`);
      if (response.data && response.data.length > 0) {
        // Get today's date
        const today = new Date().toISOString().slice(0, 10);

        // Find today's log first
        const todayLog = response.data.find(log => {
          const logDate = new Date(log.TIME).toISOString().slice(0, 10);
          return logDate === today;
        });

        if (todayLog) {
          // Return an object with both time and location
          return {
            time: todayLog.TIME_OUT || todayLog.TIME_IN || todayLog.TIME,
            location: todayLog.LOCATION || null
          };
        }

        // If no today's log, get the most recent log
        return {
          time: response.data[0].TIME_OUT || response.data[0].TIME_IN || response.data[0].TIME,
          location: response.data[0].LOCATION || null
        };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching logs for ${username}:`, error);
      return null;
    }
  };

  // Function to calculate status based on logs
  const calculateStatusFromLogs = async (username) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/user-time-status/${username}`);
      if (response.data && response.data.success) {
        return response.data.calculatedStatus || 'Off Duty';
      }
      return 'Off Duty';
    } catch (error) {
      console.error(`Error calculating status for ${username}:`, error);
      return 'Off Duty';
    }
  };

  // Function to load schedules from the database with calculated status and log times
  const loadSchedules = async () => {
    try {
      setIsLoading(true);

      // Start API requests
      const tanodResponse = await axios.get(`${BASE_URL}/api/tanods`);
      const schedulesResponse = await axios.get(`${BASE_URL}/api/schedules`);

      if (tanodResponse.data && Array.isArray(tanodResponse.data)) {
        console.log("Loaded tanods:", tanodResponse.data);
        console.log("Loaded schedules:", schedulesResponse.data);

        const allSchedules = schedulesResponse.data || [];

        const normalizeUsername = (value) => String(value || '').trim().toLowerCase();

        // Calculate status and get log times for each personnel
        const personnelWithCalculatedData = await Promise.all(
          tanodResponse.data.map(async (person) => {
            // Find the schedule for this person
            const personSchedule = allSchedules.find((schedule) => {
              // Prefer matching by FK if present
              if (schedule?.user_id != null && person?.ID != null) {
                return Number(schedule.user_id) === Number(person.ID ?? person.ID);
              }

              // Some rows (e.g., older sync) may not have user_id populated; fall back to ID match
              if (schedule?.ID != null && person?.ID != null) {
                return Number(schedule.ID) === Number(person.ID);
              }

              // Final fallback: normalized username match
              return normalizeUsername(schedule?.USER) === normalizeUsername(person?.USER);
            });

            const statusPayload = await getUserTimeStatusPayload(person.USER);
            const calculatedStatus = statusPayload?.calculatedStatus || 'Off Duty';
            const evidenceLogs = statusPayload?.logs || null;
            const logData = await getMostRecentLogTime(person.USER);

            return {
              ...person,
              // Add schedule-specific data if found
              SCHEDULE_ID: personSchedule?.ID || null,
              SCHEDULE_TIME: personSchedule?.TIME || null,
              SCHEDULE_LOCATION: personSchedule?.LOCATION || null,
              DAY: personSchedule?.DAY || null,
              START_TIME: personSchedule?.START_TIME || null,
              MONTH: personSchedule?.MONTH || 'All',
              END_TIME: personSchedule?.END_TIME || null,
              CALCULATED_STATUS: calculatedStatus,
              LOG_TIME: logData?.time || null,
              LOG_LOCATION: logData?.location || null, // Add log location
              EVIDENCE_LOGS: evidenceLogs,
              HAS_EVIDENCE: hasAnyEvidence(evidenceLogs)
            };
          })
        );

        setPersonnel(personnelWithCalculatedData);
      } else {
        console.log("No tanods found or invalid data format");
        setPersonnel([]);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading tanod schedules:', err);
      setError('Failed to load tanod schedules. Please try again later.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial load of schedules
    loadSchedules();

    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(() => {
      loadSchedules();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleClick = (person) => {
    setSelectedPerson(person);
    setFormData({
      status: person.CALCULATED_STATUS || '',
      location: person.SCHEDULE_LOCATION || '',
      // Ensure 'day' is always an array, splitting the string from the DB
      day: person.DAY ? person.DAY.split(',').map(d => d.trim()) : [],
      start_time: person.START_TIME || '',
      end_time: person.END_TIME || '',
      month: person.MONTH || 'All'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedPerson(null);
    setShowModal(false);
  };

  const openEvidenceModal = (person) => {
    setEvidencePerson(person);
    setShowEvidenceModal(true);
  };

  const closeEvidenceModal = () => {
    setShowEvidenceModal(false);
    setEvidencePerson(null);
  };

  const handleSave = async () => {
    try {
      const dayList = Array.isArray(formData.day)
        ? formData.day.map(d => String(d).trim()).filter(Boolean)
        : String(formData.day || '').split(',').map(d => d.trim()).filter(Boolean);

      if (!dayList.length || !String(formData.start_time || '').trim() || !String(formData.end_time || '').trim()) {
        setError('Please select at least one day and set start/end time before saving.');
        return;
      }

      let response;
      if (selectedPerson.SCHEDULE_ID) {
        // Update existing schedule
        response = await axios.put(`${BASE_URL}/api/schedules/${selectedPerson.SCHEDULE_ID}`, {
          location: formData.location,
          // Join the array of days into a comma-separated string for the DB
          day: dayList.join(', '),
          start_time: formData.start_time,
          end_time: formData.end_time,
          month: formData.month
        });
      } else {
        // Create new schedule
        response = await axios.post(`${BASE_URL}/api/schedules`, {
          user: selectedPerson.USER,
          location: formData.location,
          // Join the array of days into a comma-separated string for the DB
          day: dayList.join(', '),
          start_time: formData.start_time,
          end_time: formData.end_time,
          month: formData.month
        });
      }

      if (response.data.success) {
        await loadSchedules();
        closeModal();
      } else {
        setError(response?.data?.message || 'Failed to update schedule. Please try again.');
      }
    } catch (err) {
      console.error('Error updating schedule:', err);
      const serverMessage = err?.response?.data?.message || err?.response?.data?.error;
      if (serverMessage) {
        setError(serverMessage);
      } else {
        setError('An error occurred while updating the schedule.');
      }
    }
  };

  const handleClearSchedule = async () => {
    if (!selectedPerson || !selectedPerson.SCHEDULE_ID) {
      setError('No schedule to clear for this person.');
      return;
    }

    if (window.confirm(`Are you sure you want to clear the schedule for ${selectedPerson.USER}?`)) {
      try {
        const response = await axios.delete(`${BASE_URL}/api/schedules/${selectedPerson.SCHEDULE_ID}`);
        if (response.data.success) {
          await loadSchedules();
          closeModal();
        } else {
          setError('Failed to clear schedule. Please try again.');
        }
      } catch (err) {
        console.error('Error clearing schedule:', err);
        setError('An error occurred while clearing the schedule.');
      }
    }
  };

  const handleDeleteScheduleFromRow = async (person) => {
    if (!person || !person.SCHEDULE_ID) {
      setError('No schedule to delete for this person.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete the schedule for ${person.USER}?`)) {
      try {
        const response = await axios.delete(`${BASE_URL}/api/schedules/${person.SCHEDULE_ID}`);
        if (response.data.success) {
          await loadSchedules();
          if (selectedPerson && selectedPerson.USER === person.USER) {
            closeModal();
          }
        } else {
          setError('Failed to delete schedule. Please try again.');
        }
      } catch (err) {
        console.error('Error deleting schedule:', err);
        setError('An error occurred while deleting the schedule.');
      }
    }
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Special handling for the 'day' checkboxes
    if (name === 'day' && type === 'checkbox') {
      setFormData(prev => {
        const newDays = checked
          ? [...prev.day, value] // Add day to array if checked
          : prev.day.filter(d => d !== value); // Remove day from array if unchecked
        return { ...prev, day: newDays };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const filteredPersonnel = personnel.filter(person =>
    person.USER?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to format datetime for display
  const formatScheduleTime = (day, startTime, endTime, month) => {
    if (!day || !startTime || !endTime) return "Not set";
    // If 'day' is an array, join it for display
    const dayString = Array.isArray(day) ? day.join(', ') : day;
    try {
      const formatTime = (timeStr) => new Date(`1970-01-01T${timeStr}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
      const monthDisplay = month && month !== 'All' ? `${month} - ` : '';
      return `${monthDisplay}${dayString}, ${formatTime(startTime)} - ${formatTime(endTime)}`;
    } catch (error) {
      return "Invalid date";
    }
  };

  const getStatusClass = (status) => {
    if (status === 'On Duty') {
      return 'status-on-duty';
    } else if (status === 'Off Duty') {
      return 'status-off-duty';
    }
    return 'status-default';
  };

  const handleCalendarEventClick = (person) => {
    handleClick(person);
  };

  return (
    <div className="schedule-assignment-container">
      <MainSidebarWrapper />
      <div style={{ width: '100%' }}>
        <div className="header1">
          <div className="header-content">
            <div className="header-title-container">
              <h1 className="header-title">
                Tanod Schedule & Assignment
              </h1>
              <p className="header-subtitle">Manage tanod schedules, assign tanods, and track assignment status</p>
            </div>
          </div>
        </div>

        <div className="main-content">
        <EditScheduleModal
          isOpen={showModal}
          onClose={closeModal}
          selectedPerson={selectedPerson}
          formData={formData}
          onFormChange={handleChange}
          onSave={handleSave}
          onClear={handleClearSchedule}
          getImageUrl={getImageUrl}
        />

        {showEvidenceModal && evidencePerson && (
          <div className="evidence-modal-overlay" onClick={closeEvidenceModal}>
            <div className="evidence-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="evidence-modal-header">
                <div>
                  <div className="evidence-modal-title">Evidence</div>
                  <div className="evidence-modal-subtitle">{evidencePerson.USER}</div>
                </div>
                <button className="evidence-modal-close" onClick={closeEvidenceModal} aria-label="Close evidence modal">
                  ×
                </button>
              </div>

              <div className="evidence-modal-body">
                {evidencePerson.HAS_EVIDENCE ? (
                  <>
                    <div className="evidence-section">
                      <div className="evidence-section-title">Time In</div>
                      <div className="evidence-meta">{evidencePerson.EVIDENCE_LOGS?.timeIn?.time || '—'}</div>

                      <div className="evidence-media-grid">
                        <div className="evidence-media-card">
                          <div className="evidence-media-label">Photo</div>
                          {evidencePerson.EVIDENCE_LOGS?.timeIn?.photo ? (
                            <>
                              <a className="evidence-link" href={getMediaUrl(evidencePerson.EVIDENCE_LOGS.timeIn.photo)} target="_blank" rel="noreferrer">
                                Open Photo
                              </a>
                              <img
                                className="evidence-image"
                                src={getMediaUrl(evidencePerson.EVIDENCE_LOGS.timeIn.photo)}
                                alt="Time in evidence"
                              />
                            </>
                          ) : (
                            <div className="evidence-empty">No photo</div>
                          )}
                        </div>

                        <div className="evidence-media-card">
                          <div className="evidence-media-label">Video</div>
                          {evidencePerson.EVIDENCE_LOGS?.timeIn?.video ? (
                            <>
                              <a className="evidence-link" href={getMediaUrl(evidencePerson.EVIDENCE_LOGS.timeIn.video)} target="_blank" rel="noreferrer">
                                Open Video
                              </a>
                              <video className="evidence-video" controls src={getMediaUrl(evidencePerson.EVIDENCE_LOGS.timeIn.video)} />
                            </>
                          ) : (
                            <div className="evidence-empty">No video</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="evidence-section">
                      <div className="evidence-section-title">Time Out</div>
                      <div className="evidence-meta">{evidencePerson.EVIDENCE_LOGS?.timeOut?.time || '—'}</div>

                      <div className="evidence-media-grid">
                        <div className="evidence-media-card">
                          <div className="evidence-media-label">Photo</div>
                          {evidencePerson.EVIDENCE_LOGS?.timeOut?.photo ? (
                            <>
                              <a className="evidence-link" href={getMediaUrl(evidencePerson.EVIDENCE_LOGS.timeOut.photo)} target="_blank" rel="noreferrer">
                                Open Photo
                              </a>
                              <img
                                className="evidence-image"
                                src={getMediaUrl(evidencePerson.EVIDENCE_LOGS.timeOut.photo)}
                                alt="Time out evidence"
                              />
                            </>
                          ) : (
                            <div className="evidence-empty">No photo</div>
                          )}
                        </div>

                        <div className="evidence-media-card">
                          <div className="evidence-media-label">Video</div>
                          {evidencePerson.EVIDENCE_LOGS?.timeOut?.video ? (
                            <>
                              <a className="evidence-link" href={getMediaUrl(evidencePerson.EVIDENCE_LOGS.timeOut.video)} target="_blank" rel="noreferrer">
                                Open Video
                              </a>
                              <video className="evidence-video" controls src={getMediaUrl(evidencePerson.EVIDENCE_LOGS.timeOut.video)} />
                            </>
                          ) : (
                            <div className="evidence-empty">No video</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="evidence-empty">No evidence uploaded yet.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <div className="error-content">
              <div className="error-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="error-text">
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="table-container">
          <div className="table-header">
            <div className="search-section">
              <input
                type="text"
                placeholder="Search tanods..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="action-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCalendar(!showCalendar)}
              >
                {showCalendar ? (
                  <><List size={16} style={{ marginRight: '8px' }} /> List View</>
                ) : (
                  <><Calendar size={16} style={{ marginRight: '8px' }} /> Calendar View</>
                )}
              </button>
              <button
                className="btn btn-secondary"
                onClick={loadSchedules}
                disabled={isLoading}
              >
                Refresh Schedules
              </button>
            </div>
          </div>

          {showCalendar ? (
            <ScheduleCalendar events={filteredPersonnel} onEventClick={handleCalendarEventClick} />
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="col-id">ID</th>
                    <th>Tanod</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Schedule Time</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPersonnel.length > 0 ? (
                    filteredPersonnel.map((person) => (
                      <tr key={person.ID}>
                        <td className="font-medium">
                          #{person.ID}
                        </td>
                        <td>
                          <div className="tanod-cell">
                            <div className="tanod-avatar">
                              {/* Avatar component is now in EditScheduleModal.jsx */}
                            </div>
                            <div className="tanod-name">
                              {person.USER}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusClass(person.CALCULATED_STATUS)}`}>
                            {person.CALCULATED_STATUS || "Off Duty"}
                          </span>
                        </td>
                        <td>
                          {person.SCHEDULE_LOCATION || "Not assigned"}
                        </td>
                        <td>{formatScheduleTime(person.DAY, person.START_TIME, person.END_TIME, person.MONTH)}</td>
                        <td className="actions-cell">
                          <button
                            onClick={() => handleClick(person)}
                            className="btn btn-edit"
                          >
                            {person.SCHEDULE_ID ? 'Edit' : 'Add'}
                          </button>

                          <button
                            onClick={() => openEvidenceModal(person)}
                            className="btn btn-secondary btn-evidence"
                            disabled={!person.HAS_EVIDENCE}
                            title={person.HAS_EVIDENCE ? 'View evidence' : 'No evidence yet'}
                          >
                            Evidence
                          </button>

                          {person.SCHEDULE_ID && (
                            <button
                              onClick={() => handleDeleteScheduleFromRow(person)}
                              className="btn btn-delete"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-data">
                        No tanods found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      </div>
      </div>
  );
};

export default ScheduleAssignment;
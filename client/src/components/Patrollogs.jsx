import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MainSidebarWrapper from './MainSidebarWrapper';
import './Patrollogs.css';
import { BASE_URL } from '../config';
import ActivityDetailsModal from './Modals/ActivityDetails';

const PatrolLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activitiesSearchTerm, setActivitiesSearchTerm] = useState('');
  const [patrolLogs, setPatrolLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state for both tables
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSchedulePage, setCurrentSchedulePage] = useState(1);
  const itemsPerPage = 10;

  const [patrolActivitiesData, setPatrolActivitiesData] = useState([]);

  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to load logs from the database (for TANOD SCHEDULE)
  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(`${BASE_URL}/api/logs`);
      
      if (response.data && Array.isArray(response.data)) {
        const transformedLogs = response.data.map((log, index) => ({
          id: log.ID || index + 1,
          displayId: 1000 + ((log.ID || index) % 9000),
          tanod: log.USER || 'Unknown',
          timeIn: log.TIME_IN || 'Not specified', 
          timeOut: log.TIME_OUT || 'Not specified',
          location: log.LOCATION || 'Not specified',
          status: log.ACTION || 'No Action'
        }));
        
        setPatrolLogs(transformedLogs);
      } else {
        setPatrolLogs([]);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading patrol logs:', err);
      setError('Failed to load patrol logs. Please try again later.');
      setIsLoading(false);
    }
  };

  // Function to load patrol activities from logs_patrol table
  const loadPatrolActivities = async () => {
    try {
      setError(null);

      const response = await axios.get(`${BASE_URL}/api/logs_patrol`);
      
      if (response.data && Array.isArray(response.data)) {
        const transformedActivities = response.data.map((activity, index) => ({
          // Keep all original data for the modal
          ...activity,
          // Add display properties
          id: activity.ID || `activity-${index}`,
          displayId: activity.ID || (1000 + (index % 9000)),
          tanod: activity.USER || 'Unknown',
          time: activity.TIME || 'Not specified',
          location: activity.LOCATION || 'Not specified',
          action: activity.ACTION || 'No Action',
          status: activity.status || 'Pending',
          resolvedBy: activity.resolved_by || 'N/A',
          resolvedAt: activity.resolved_at || null,
          resolutionImage: activity.resolution_image_path || null,
          incidentId: activity.incident_id || null
        }));
        
        setPatrolActivitiesData(transformedActivities);
      } else {
        setPatrolActivitiesData([]);
      }
    } catch (err) {
      console.error('Error loading patrol activities:', err);
      setError('Failed to load patrol activities.');
      setPatrolActivitiesData([]);
    }
  };

  const handleRowClick = (activity) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedActivity(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([loadLogs(), loadPatrolActivities()]);
      setIsLoading(false);
    };
    fetchData();
  }, []);

// Standardized Official Print
  const handlePrint = () => {
    window.print();
  };

  

  // Filter logs based on search term for TANOD SCHEDULE
  const filteredLogs = patrolLogs.filter(log =>
    log.tanod.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic for tanod schedule
  const totalSchedulePages = Math.ceil(filteredLogs.length / itemsPerPage);
  const scheduleStartIndex = (currentSchedulePage - 1) * itemsPerPage;
  const scheduleEndIndex = scheduleStartIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(scheduleStartIndex, scheduleEndIndex);

  // Filter activities based on search term for PATROL ACTIVITIES
  const filteredActivities = patrolActivitiesData.filter(activity =>
    activity.tanod.toLowerCase().includes(activitiesSearchTerm.toLowerCase()) ||
    activity.location.toLowerCase().includes(activitiesSearchTerm.toLowerCase()) ||
    activity.action.toLowerCase().includes(activitiesSearchTerm.toLowerCase()) ||
    (activity.status && activity.status.toLowerCase().includes(activitiesSearchTerm.toLowerCase())) ||
    (activity.resolvedBy && activity.resolvedBy.toLowerCase().includes(activitiesSearchTerm.toLowerCase()))
  );

  // Pagination logic for patrol activities
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = filteredActivities.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSchedulePageChange = (pageNumber) => {
    setCurrentSchedulePage(pageNumber);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSchedulePrevPage = () => {
    if (currentSchedulePage > 1) {
      setCurrentSchedulePage(currentSchedulePage - 1);
    }
  };

  const handleScheduleNextPage = () => {
    if (currentSchedulePage < totalSchedulePages) {
      setCurrentSchedulePage(currentSchedulePage + 1);
    }
  };

  const getStatusClass = (status) => {
    if (status === undefined || status === null) {
      return 'status-default';
    }
    const statusLower = status.toLowerCase();
    if (statusLower.includes('resolved') || statusLower.includes('completed') || statusLower.includes('available')) {
      return 'status-success';
    } else if (statusLower.includes('progress') || statusLower.includes('way') || statusLower.includes('pending')) {
      return 'status-warning';
    } else if (statusLower.includes('duty')) {
      return 'status-info';
    }
    return 'status-default';
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString || dateTimeString === 'Not specified') return '—';
    try {
      return new Date(dateTimeString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTimeString;
    }
  };

return (
    <>
      {/* 🖥️ WEB VIEW - Hidden during print */}
      <div className="patrol-logs-container hide-on-print">
        <div className="no-print">
          <MainSidebarWrapper />
        </div>

        <div style={{ width: '100%' }}>
          <div className="header1 no-print">
            <div className="header-content">
              <div className="header-title-container">
                <h1 className="header-title">
                  <span className="title-icon">🛡️</span>Patrol Logs
                </h1>
                <p className="header-subtitle">Track tanod schedules and patrol activities</p>
              </div>
            </div>
          </div>
          
          <div className="main-content">
            {/* ... Keep all your existing dashboard code here (Error messages, Tables, Pagination) ... */}
            {/* Just make sure your Print button still calls handlePrint */}
            <button onClick={handlePrint} className="btn btn-secondary">
              <span className="btn-icon">🖨️</span> Print Logs
            </button>
            
            {/* [Existing Table Code Omitted for Brevity] */}
          </div>

          <ActivityDetailsModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            activity={selectedActivity}
          />
        </div>
      </div>

      {/* 🖨️ OFFICIAL PRINT VIEW - Hidden during screen use */}
      <div className="patrol-print-list" aria-hidden="true">
        
        {/* OFFICIAL BARANGAY LETTERHEAD */}
        <div className="incident-print-header">
          <div className="official-letterhead">
            <p className="republic-text">Republic of the Philippines</p>
            <p className="province-text">Province of Quezon</p>
            <p className="municipality-text">Municipality of Real</p>
            <h2 className="barangay-text">BARANGAY TIGNOAN</h2>
            <h3 className="office-text">OFFICE OF THE BARANGAY TANOD / PATROL</h3>
          </div>
          
          <div className="report-title-section">
            <h1>OFFICIAL PATROL LOGS SUMMARY</h1>
            <div className="incident-print-meta">Date Printed: {new Date().toLocaleString()}</div>
          </div>
        </div>

        {/* OFFICIAL DATA TABLE (Uses filteredLogs to show the FULL record, not just the current page) */}
        <table className="official-table">
          <thead>
            <tr>
              <th style={{width: '10%'}}>ID</th>
              <th style={{width: '20%'}}>Tanod Name</th>
              <th style={{width: '20%'}}>Time In</th>
              <th style={{width: '20%'}}>Time Out</th>
              <th style={{width: '30%'}}>Location / Coverage</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs && filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="cell-id">LOG-{String(log.displayId).padStart(6, '0')}</td>
                  <td>{log.tanod}</td>
                  <td>{formatDateTime(log.timeIn)}</td>
                  <td>{formatDateTime(log.timeOut)}</td>
                  <td>{log.location || "Main Patrol Route"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-cell">No patrol logs recorded for this period.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* OFFICIAL SIGNATURE BLOCK */}
        <div className="incident-print-footer">
          <div className="signature-block">
            <p className="signature-label">Prepared by:</p>
            <div className="signature-line"></div>
            <p className="signature-name">Name & Signature</p>
            <p className="signature-title">Barangay Admin / Duty Officer</p>
          </div>
          <div className="signature-block">
            <p className="signature-label">Noted by:</p>
            <div className="signature-line"></div>
            <p className="signature-name">Barangay Captain</p>
            <p className="signature-title">Punong Barangay</p>
          </div>
        </div>
      </div>
    </>
  );
};
export default PatrolLogs;
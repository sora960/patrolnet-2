import React, { useState, useEffect } from 'react';
import './Firewall.css';
import { Shield, List, Plus, Trash2, Loader, Activity } from 'lucide-react';
import { BASE_URL } from '../config';

const Firewall = () => {
  const [blockedIps, setBlockedIps] = useState([]);
  const [ipToBlock, setIpToBlock] = useState('');
  const [accessLogs, setAccessLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFirewallData = async () => {
    setLoading(true);
    setError('');
    try {
      const [blockedIpsRes, accessLogsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/firewall/blocked-ips`),
        fetch(`${BASE_URL}/api/firewall/access-logs`)
      ]);

      if (!blockedIpsRes.ok) throw new Error('Failed to fetch blocked IPs');
      if (!accessLogsRes.ok) throw new Error('Failed to fetch access logs');

      const blockedIpsData = await blockedIpsRes.json();
      const accessLogsData = await accessLogsRes.json();

      setBlockedIps(blockedIpsData);
      setAccessLogs(accessLogsData);

    } catch (err) {
      console.error("Error fetching firewall data:", err);
      setError(err.message || 'Failed to load firewall data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFirewallData();
  }, []);

  const handleBlockIp = async (e) => {
    e.preventDefault();
    if (!ipToBlock.trim()) {
      setError('IP address cannot be empty.');
      return;
    }
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ipToBlock)) {
      setError('Invalid IP address format.');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/firewall/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip_address: ipToBlock, reason: 'Manual block' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to block IP.');
      }

      await fetchFirewallData();
      setIpToBlock('');
      setError('');
    } catch (err) {
      console.error("Error blocking IP:", err);
      setError(err.message);
    }
  };

  const handleUnblockIp = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/api/firewall/unblock/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unblock IP.');
      }

      await fetchFirewallData();
    } catch (err) {
      console.error("Error unblocking IP:", err);
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Success': return 'status-success';
      case 'Failed': return 'status-failed';
      case 'Blocked': return 'status-blocked';
      default: return '';
    }
  };

  return (
    <div className="firewall-page-container">
      <div className="firewall-header">
        <h1 className="firewall-title">
          <Shield size={28} className="firewall-title-icon" />
          IP Management
        </h1>
        <p className="firewall-subtitle">Monitor and manage network access by blocking specific IP addresses.</p>
      </div>

      <div className="firewall-content-wrapper">
        <div className="firewall-block-section">
          <form onSubmit={handleBlockIp} className="firewall-form">
            <input
              type="text"
              value={ipToBlock}
              onChange={(e) => {
                setIpToBlock(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter IP address to block"
              className="firewall-input"
            />
            <button type="submit" className="firewall-block-btn">
              <Plus size={16} />
              Block IP
            </button>
          </form>
          {error && <p className="firewall-error-message">{error}</p>}
        </div>

        <div className="firewall-list-section">
          <h2 className="firewall-list-title">
            <List size={20} />
            Blocked IP Addresses ({blockedIps.length})
          </h2>

          <div className="firewall-table-container">
            {loading ? (
              <div className="firewall-loading">
                <Loader size={32} className="spinner" />
                <p>Loading blocked IPs...</p>
              </div>
            ) : (
              <table className="firewall-table">
                <thead>
                  <tr>
                    <th>IP Address</th>
                    <th>Reason</th>
                    <th>Date Blocked</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blockedIps.length > 0 ? (
                    blockedIps.map(ip => (
                      <tr key={ip.id}>
                        <td className="ip-address-cell">{ip.ip_address}</td>
                        <td>{ip.reason}</td>
                        <td>{formatDate(ip.created_at)}</td>
                        <td>
                          <button onClick={() => handleUnblockIp(ip.id)} className="firewall-unblock-btn">
                            <Trash2 size={16} />
                            Unblock
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="firewall-no-data">
                        No IP addresses are currently blocked.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="firewall-list-section">
          <h2 className="firewall-list-title">
            <Activity size={20} />
            Recent Access Logs ({accessLogs.length})
          </h2>

          <div className="firewall-table-container">
            {loading ? (
              <div className="firewall-loading">
                <Loader size={32} className="spinner" />
                <p>Loading access logs...</p>
              </div>
            ) : (
              <table className="firewall-table">
                <thead>
                  <tr>
                    <th>IP Address</th>
                    <th>Mac Address</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {accessLogs.length > 0 ? (
                    accessLogs.map(log => (
                      <tr key={log.id}>
                        <td className="ip-address-cell">{log.ip_address}</td>
                        <td className="device-id-cell">{log.device_id || 'N/A'}</td>
                        <td>{log.user}</td>
                        <td>{log.action}</td>
                        <td><span className={`status-badge ${getStatusClass(log.status)}`}>{log.status}</span></td>
                        <td>{formatDate(log.timestamp)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6" className="firewall-no-data">No access logs found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Firewall;
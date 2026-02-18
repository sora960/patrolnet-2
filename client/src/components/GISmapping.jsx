import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, RefreshCw, AlertTriangle, Filter, BarChart3, Clock, MapPinIcon, Plus, X, ChevronDown, Smile, TrendingUp, Calendar, FileText } from 'lucide-react';
import { BASE_URL } from '../config';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, Legend, Area, AreaChart } from 'recharts';
import BarangayReport from './BarangayReport';
import { useMap } from 'react-leaflet';
import 'leaflet.heat';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomIcon = (icon, color) => {
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, ${color}, ${color}dd);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        cursor: pointer;
      ">${icon}</div>
    `,
    className: 'custom-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

const emojiSuggestions = ['🌊', '🔥', '🚗', '🚨', '🚑', '⚡', '🥊', '⚠️', '❓', '🚧', '💨', '💥', '💧', '🌳', '🏠', '🏢', '🌉', '⛰️', '🚓', '🚲', '🚶', '📢', '⚙️', '🦠', '☢️'];

const defaultIncidentTypes = {
  'Fire': { icon: '🔥', color: '#ef4444' },
  'Accident': { icon: '🚗', color: '#f97316' },
  'Crime': { icon: '🚨', color: '#8b5cf6' },
  'Emergency': { icon: '🚑', color: '#ec4899' },
  'Drowning': { icon: '🆘', color: '#06b6d4' },
  'Electrical': { icon: '⚡', color: '#eab308' },
  'Assault': { icon: '🥊', color: '#dc2626' },
  'Other': { icon: '⚠️', color: '#3b82f6' }
};

// Modal Component
const AddTypeModal = ({ onClose, onAdd, newType, onChange, error }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
  }}>
    <div style={{
      background: 'white', padding: '1.5rem', borderRadius: '16px',
      width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Add Incident Type</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <X size={20} color="#6b7280" />
        </button>
      </div>
      <form onSubmit={onAdd}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#374151' }}>
            Type Name
          </label>
          <input
            type="text"
            placeholder="e.g., Flood"
            value={newType.name}
            onChange={(e) => onChange('name', e.target.value)}
            required
            style={{
              width: '100%', padding: '0.75rem', border: '1px solid #d1d5db',
              borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#374151' }}>
            Icon
          </label>
          <div style={{ position: 'relative' }}>
            <Smile size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <select
              value={newType.icon}
              onChange={(e) => onChange('icon', e.target.value)}
              required
              style={{
                width: '100%', padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem',
                appearance: 'none', cursor: 'pointer', boxSizing: 'border-box', background: 'white'
              }}
            >
              <option value="" disabled>Select icon</option>
              {emojiSuggestions.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <ChevronDown size={18} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
          </div>
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#374151' }}>
            Color
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input
              type="color"
              value={newType.color}
              onChange={(e) => onChange('color', e.target.value)}
              style={{ width: '60px', height: '40px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', padding: '2px' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', border: '2px solid white',
                background: `linear-gradient(135deg, ${newType.color}, ${newType.color}dd)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>{newType.icon}</div>
              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Preview</span>
            </div>
          </div>
        </div>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{
            padding: '0.625rem 1.25rem', borderRadius: '8px', border: '1px solid #d1d5db',
            background: 'white', fontWeight: 500, cursor: 'pointer'
          }}>Cancel</button>
          <button type="submit" style={{
            padding: '0.625rem 1.25rem', borderRadius: '8px', border: 'none',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white',
            fontWeight: 500, cursor: 'pointer'
          }}>Add Type</button>
        </div>
      </form>
    </div>
  </div>
);


// Internal component to render the heatmap layer
const HeatmapLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    // Transform data: [lat, lng, intensity]
    const heatPoints = points.map(p => [p.lat, p.lng, p.intensity]);

    const heat = L.heatLayer(heatPoints, {
      radius: 50, // INCREASED: Makes the spots bigger so they merge (less "dotty")
      blur: 35,   // INCREASED: Makes the edges softer (more "subtle")
      maxZoom: 17,
      // EXACT COLORS: Only use Blue -> Orange -> Red
      gradient: { 
        0.2: '#3b82f6', // Low (Blue)
        0.6: '#f59e0b', // Medium (Orange)
        1.0: '#ef4444'  // High (Red)
      } 
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [points, map]);

  return null;
};

function GISMapping({ showOnlyMap }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([14.565307024431522, 121.61516580730677]);
  const [filterType, setFilterType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newType, setNewType] = useState({ name: '', icon: '❓', color: '#6b7280' });
  const [addTypeError, setAddTypeError] = useState('');
  const [incidentTypeConfig, setIncidentTypeConfig] = useState(defaultIncidentTypes);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Fetch Heatmap Data
  useEffect(() => {
    fetch(`${BASE_URL}/api/analytics/heatmap`)
      .then(res => res.json())
      .then(data => setHeatmapData(data))
      .catch(err => console.error("Heatmap error:", err));
  }, [showHistory]);

  // Calculate risk level based on incident frequency in a location
  const getRiskLevel = useMemo(() => {
    const riskMap = {};
    incidents.forEach(incident => {
      if (incident.location) {
        riskMap[incident.location] = (riskMap[incident.location] || 0) + 1;
      }
    });
    return riskMap;
  }, [incidents]);

  const getRiskColor = (location) => {
    const count = getRiskLevel[location] || 0;
    if (count >= 3) return "#ef4444"; // Red - High Risk
    if (count >= 2) return "#f59e0b"; // Orange - Medium Risk
    return "#3b82f6"; // Blue - Low Risk
  };

  const getRiskLevel_Text = (location) => {
    const count = getRiskLevel[location] || 0;
    if (count >= 3) return "High Risk";
    if (count >= 2) return "Medium Risk";
    return "Low Risk";
  };

  const getIncidentConfig = (type) => incidentTypeConfig[type] || incidentTypeConfig['Other'];

  const handleAddIncidentType = async (e) => {
    e.preventDefault();
    setAddTypeError('');
    if (!newType.name || incidentTypeConfig[newType.name]) {
      setAddTypeError("Type name must be unique and not empty.");
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/incident_types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newType),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || 'Failed to save');
      const saved = await res.json();
      setIncidentTypeConfig(prev => ({ ...prev, [saved.name]: { icon: saved.icon, color: saved.color } }));
      setShowAddTypeModal(false);
      setNewType({ name: '', icon: '❓', color: '#6b7280' });
    } catch (err) {
      setAddTypeError(err.message);
    }
  };

  const handleNewTypeChange = (field, value) => {
    setAddTypeError('');
    setNewType(prev => ({ ...prev, [field]: value }));
  };

  const closeModal = () => {
    setShowAddTypeModal(false);
    setNewType({ name: '', icon: '❓', color: '#6b7280' });
    setAddTypeError('');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const endpoint = showHistory ? `${BASE_URL}/api/incidents/complete/all` : `${BASE_URL}/api/incidents`;
        const [incRes, typesRes] = await Promise.all([
          fetch(endpoint),
          fetch(`${BASE_URL}/api/incident_types`)
        ]);
        if (!incRes.ok) throw new Error('Failed to fetch incidents');
        const incData = await incRes.json();
        if (typesRes.ok) {
          const typesData = await typesRes.json();
          const customTypes = typesData.reduce((acc, t) => ({ ...acc, [t.name]: { icon: t.icon, color: t.color } }), {});
          setIncidentTypeConfig({ ...defaultIncidentTypes, ...customTypes });
        }
        const valid = incData.filter(i => i.latitude && i.longitude && !isNaN(parseFloat(i.latitude)) && !isNaN(parseFloat(i.longitude)));
        setIncidents(valid);
        if (valid.length > 0) setMapCenter([parseFloat(valid[0].latitude), parseFloat(valid[0].longitude)]);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showHistory]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/incidents`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const valid = data.filter(i => i.latitude && i.longitude && !isNaN(parseFloat(i.latitude)) && !isNaN(parseFloat(i.longitude)));
      setIncidents(valid);
      setError(null);
    } catch (err) {
      setError('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dt) => new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getStatusStyle = (status) => {
    const styles = {
      'Resolved': { background: '#dcfce7', color: '#166534' },
      'In Progress': { background: '#fef3c7', color: '#92400e' },
      'Under Review': { background: '#fef3c7', color: '#a16207' }
    };
    return styles[status] || { background: '#f3f4f6', color: '#374151' };
  };

  const filteredIncidents = incidents.filter(i => {
    const matchType = filterType === 'All' || i.incident_type === filterType;
    const matchSearch = [i.location, i.incident_type].some(f => f?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchType && matchSearch;
  });

  const chartData = useMemo(() => {
    const counts = {};
    incidents.forEach(i => { const t = i.incident_type || 'Other'; counts[t] = (counts[t] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count, fill: getIncidentConfig(name).color }));
  }, [incidents, incidentTypeConfig]);

  const monthlyChartData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), year: d.getFullYear(), monthNum: d.getMonth() });
    }
    const data = months.map(m => {
      const counts = { month: m.month };
      let total = 0;
      Object.keys(incidentTypeConfig).forEach(type => {
        const count = incidents.filter(inc => {
          const incDate = new Date(inc.datetime);
          return incDate.getMonth() === m.monthNum && incDate.getFullYear() === m.year && inc.incident_type === type;
        }).length;
        counts[type] = count;
        total += count;
      });
      counts.total = total;
      return counts;
    });
    return data;
  }, [incidents, incidentTypeConfig]);

  // Simplified map-only view
  if (showOnlyMap) {
    return (
      <div style={{ height: '400px', borderRadius: '12px', overflow: 'hidden' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f1f5f9' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div style={{ position: "relative", height: "100%" }}>
    
    
  {/* SMART LEGEND: ONLY SHOW WHEN HEATMAP IS ON */}
  {showHeatmap && (
    <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000, background: "white", padding: "10px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
      <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: 700, color: "#333" }}>
        Risk Density
      </h4>
      
      {/* HEATMAP LEGEND (Gradient Bar) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}>
        <div style={{ 
          width: '100%', 
          height: '12px', 
          background: 'linear-gradient(to right, #3b82f6, #f59e0b, #ef4444)', 
          borderRadius: '6px',
          border: '1px solid #e5e7eb'
        }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>
          <span>Low Frequency</span>
          <span>High Frequency</span>
        </div>
      </div>
    </div>
  )}
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {filteredIncidents.map(i => (
                <Marker key={i.id} position={[parseFloat(i.latitude), parseFloat(i.longitude)]} icon={createCustomIcon(getIncidentConfig(i.incident_type).icon, getIncidentConfig(i.incident_type).color)}>
                  <Popup><strong>{i.incident_type}</strong><br />{i.location}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 50% { opacity: 0.5; } }
        .leaflet-popup-content-wrapper { border-radius: 12px !important; box-shadow: 0 10px 40px rgba(0,0,0,0.15) !important; }
        .leaflet-popup-tip { background: white !important; }
      `}</style>

      {showAddTypeModal && (
        <AddTypeModal
          onClose={closeModal}
          onAdd={handleAddIncidentType}
          newType={newType}
          onChange={handleNewTypeChange}
          error={addTypeError}
        />
      )}

      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 1.5rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>GIS Incident Mapping</h1>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>Real-time tracking & visualization {showHistory && '(Historical Data)'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => setShowHistory(!showHistory)} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
              background: showHistory ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : '#f3f4f6', 
              color: showHistory ? 'white' : '#374151',
              border: 'none', borderRadius: '20px', fontWeight: 500, cursor: 'pointer'
            }}>
              📊 {showHistory ? 'Active Only' : 'View History'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0fdf4', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.875rem', color: '#166534' }}>
              <div style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
              {filteredIncidents.length} {showHistory ? 'Total' : 'Active'}
            </div>

              <button onClick={() => setShowHeatmap(!showHeatmap)} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
              background: showHeatmap ? '#f59e0b' : '#f3f4f6', 
              color: showHeatmap ? 'white' : '#374151',
              border: 'none', borderRadius: '20px', fontWeight: 500, cursor: 'pointer'
            }}>
              🔥 {showHeatmap ? 'Heatmap ON' : 'Show Heatmap'}
            </button>




            <button onClick={fetchIncidents} disabled={loading} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white',
              border: 'none', borderRadius: '20px', fontWeight: 500, cursor: 'pointer'
            }}>
              <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Search & Filters */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} /> Filters
            </h3>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '0.75rem', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '200px', overflowY: 'auto' }}>
              {['All', ...Object.keys(incidentTypeConfig)].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem', border: 'none', borderRadius: '8px', fontSize: '0.8125rem',
                    fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                    background: filterType === type ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : '#f9fafb',
                    color: filterType === type ? 'white' : '#374151'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {type !== 'All' ? getIncidentConfig(type).icon : '📊'} {type}
                  </span>
                  <span style={{
                    background: filterType === type ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
                    padding: '2px 6px', borderRadius: '10px', fontSize: '0.75rem'
                  }}>
                    {type === 'All' ? incidents.length : incidents.filter(i => i.incident_type === type).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPinIcon size={16} /> Legend
            </h3>


            {/* Incident Types Legend */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem' }}>INCIDENT TYPES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(incidentTypeConfig).map(([type, cfg]) => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', border: '2px solid white',
                      background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}dd)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                    }}>{cfg.icon}</div>
                    <span style={{ fontSize: '0.8125rem', color: '#374151' }}>{type}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setShowAddTypeModal(true)} style={{
              width: '100%', marginTop: '0.75rem', padding: '0.5rem', border: '1px dashed #d1d5db',
              borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.8125rem',
              color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem'
            }}>
              <Plus size={14} /> Add Type
            </button>
          </div>

          {/* Stats Chart */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={16} /> Statistics
            </h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} layout="vertical" margin={{ left: -20, right: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '0.875rem' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem', padding: '1rem 0' }}>No data available</p>
            )}
          </div>
        </aside>

        {/* Map + Recent Incidents Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Map */}
          <div className="print-only" style={{ display: "none", textAlign: "center", marginBottom: "20px" }}><h1>REPUBLIC OF THE PHILIPPINES</h1><h2>Barangay Tignoan Official Incident Report</h2><hr/></div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ height: '500px', borderRadius: '8px', overflow: 'hidden' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f1f5f9' }}>
                  <div style={{ width: 48, height: 48, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                  <p style={{ color: '#6b7280' }}>Loading incidents...</p>
                </div>
              ) : error ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#fef2f2', color: '#dc2626' }}>
                  <AlertTriangle size={48} style={{ marginBottom: '1rem' }} />
                  <p style={{ marginBottom: '1rem' }}>{error}</p>
                  <button onClick={fetchIncidents} style={{ padding: '0.5rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
                </div>
              ) : (
                <div style={{ position: "relative", height: "100%" }}>

                {/* SMART LEGEND: ONLY SHOW WHEN HEATMAP IS ON */}
{showHeatmap && (
  <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000, background: "white", padding: "10px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
    <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: 700, color: "#333" }}>
      Risk Density
    </h4>
    
    {/* HEATMAP LEGEND (Gradient Bar) */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}>
      <div style={{ 
        width: '100%', 
        height: '12px', 
        background: 'linear-gradient(to right, #3b82f6, #f59e0b, #ef4444)', 
        borderRadius: '6px',
        border: '1px solid #e5e7eb'
      }}></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>
        <span>Low Frequency</span>
        <span>High Frequency</span>
      </div>
    </div>
  </div>
)}

  
                  <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                    {showHeatmap ? (
                    <HeatmapLayer points={heatmapData} />
                      ) : (
                        filteredIncidents.map(incident => (
                      <Marker
                        key={incident.id}
                        position={[parseFloat(incident.latitude), parseFloat(incident.longitude)]}
                        icon={createCustomIcon(getIncidentConfig(incident.incident_type).icon, getRiskColor(incident.location))}
                      >
                        <Popup>
                          <div style={{ minWidth: 220, padding: '0.25rem' }}>
                            <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {getIncidentConfig(incident.incident_type).icon} {incident.incident_type}
                            </h4>
                            <p style={{ margin: '0.375rem 0', fontSize: '0.875rem', color: '#374151' }}>
                              <strong>📍 Location:</strong> {incident.location}
                            </p>
                            <p style={{ margin: '0.375rem 0', fontSize: '0.875rem', color: '#374151' }}>
                              <strong>📅 Reported:</strong> {formatDateTime(incident.datetime)}
                            </p>
                            <p style={{ margin: '0.375rem 0', fontSize: '0.875rem', color: '#374151' }}>
                              <strong>🗺️ Coords:</strong> {parseFloat(incident.latitude).toFixed(4)}, {parseFloat(incident.longitude).toFixed(4)}
                            </p>
                            <p style={{ margin: '0.375rem 0', fontSize: '0.875rem', color: '#dc2626', fontWeight: 600 }}>
                              <strong>⚠️ Risk Level:</strong> {getRiskLevel_Text(incident.location)}
                            </p>
                            <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                              <span style={{ ...getStatusStyle(incident.status), padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 500 }}>
                                {incident.status}
                              </span>
                            </div>
                            {incident.status === 'Resolved' && incident.resolved_at && (
                              <div style={{ fontSize: '0.75rem', color: '#059669', marginBottom: '0.5rem', padding: '0.5rem', background: '#ecfdf5', borderRadius: '6px' }}>
                                <div>✅ <strong>Resolved by:</strong> {incident.resolved_by || 'System'}</div>
                                <div>📅 <strong>At:</strong> {formatDateTime(incident.resolved_at)}</div>
                              </div>
                            )}
                            {incident.image && (
                              <img
                                src={`${BASE_URL}/uploads/${incident.image}`}
                                alt="Incident"
                                style={{ marginTop: '0.75rem', width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px' }}
                              />
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))
                  )}
                  </MapContainer>
                </div>
              )}
            </div>
          </div>

          {/* Recent Incidents */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} /> Recent Incidents
            </h3>
            {filteredIncidents.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                {filteredIncidents.slice(0, 6).map(incident => (
                  <div
                    key={incident.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.875rem', background: '#f9fafb', borderRadius: '10px',
                      border: '1px solid #f3f4f6', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#f3f4f6'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', border: '2px solid white',
                        background: `linear-gradient(135deg, ${getRiskColor(incident.location)}, ${getRiskColor(incident.location)}dd)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)', flexShrink: 0
                      }}>
                        {getIncidentConfig(incident.incident_type).icon}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1f2937' }}>
                          {incident.incident_type}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                          {incident.location}
                        </div>
                      </div>
                    </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{
                        ...getStatusStyle(incident.status),
                        padding: '3px 10px', borderRadius: '12px', fontSize: '0.6875rem', fontWeight: 500,
                        display: 'inline-block'
                      }}>
                        {incident.status}
                      </span>
                      <div style={{ fontSize: '0.6875rem', color: '#9ca3af', marginTop: '4px' }}>
                        {formatDateTime(incident.datetime)}
                      </div>
                      <button onClick={() => setSelectedIncident(incident)} style={{
                        marginTop: '4px', padding: '3px 8px', borderRadius: '6px', border: 'none',
                        background: '#f3f4f6', color: '#374151', fontSize: '0.625rem', fontWeight: 500,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px'
                      }}>
                        <FileText size={10} /> Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                <MapPin size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ margin: 0 }}>No incidents found</p>
              </div>
            )}
          </div>

          {/* Monthly Analytics */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} /> Monthly Analytics
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                <Calendar size={14} />
                Last 12 months
              </div>
            </div>
            
            {/* Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '10px', padding: '1rem', color: 'white' }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Total Incidents</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{incidents.length}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '10px', padding: '1rem', color: 'white' }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>This Month</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  {incidents.filter(i => {
                    const d = new Date(i.datetime);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  }).length}
                </div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '10px', padding: '1rem', color: 'white' }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Last Month</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  {incidents.filter(i => {
                    const d = new Date(i.datetime);
                    const now = new Date();
                    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
                  }).length}
                </div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', borderRadius: '10px', padding: '1rem', color: 'white' }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Avg/Month</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  {(incidents.length / 12).toFixed(1)}
                </div>
              </div>
            </div>

            {/* Monthly Trend Chart */}
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>Incident Trend (12 Months)</h4>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', fontSize: '0.875rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                    labelStyle={{ fontWeight: 600, marginBottom: '0.25rem' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" name="Total Incidents" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Stacked Bar Chart by Type */}
            <div>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>Incidents by Type (Monthly)</h4>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', fontSize: '0.875rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                    labelStyle={{ fontWeight: 600, marginBottom: '0.25rem' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.5rem' }} />
                  {Object.entries(incidentTypeConfig).map(([type, cfg]) => (
                    <Bar key={type} dataKey={type} stackId="a" fill={cfg.color} name={`${cfg.icon} ${type}`} radius={[0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>

      {/* Barangay Report Modal */}
      {selectedIncident && (
        <BarangayReport incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
      )}
    </div>
  );
}

export default GISMapping;
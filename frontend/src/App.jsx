import React, { useState } from 'react';
import MapTab from './components/MapTab';
import TimelineTab from './components/TimelineTab';
import LogSheet from './components/LogSheet';
import TripHistoryTab from './components/TripHistoryTab';
import { API_BASE_URL } from './config';

export default function App() {
  const [currentLocation, setCurrentLocation] = useState('Chicago, IL');
  const [pickupLocation, setPickupLocation] = useState('Green Bay, WI');
  const [dropoffLocation, setDropoffLocation] = useState('Edwardsville, IL');
  const [currentCycleUsed, setCurrentCycleUsed] = useState('50.0');
  
  // Extra metadata
  const [driverName, setDriverName] = useState('John Doe');
  const [tractorNumber, setTractorNumber] = useState('TRK-5510');
  const [trailerNumber, setTrailerNumber] = useState('TRL-8840');
  const [carrierName, setCarrierName] = useState('Apex Cargo');
  const [shippingDoc, setShippingDoc] = useState('BOL-2026-99384');
  const [commodity, setCommodity] = useState('Paper Products');
  const [startTime, setStartTime] = useState(
    new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
  );

  const [activeTab, setActiveTab] = useState('map'); // 'map', 'timeline', 'logs', 'history'
  const [activeLogDay, setActiveLogDay] = useState(0); // Index of active log day
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [routeData, setRouteData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaveSuccess(false);

    const payload = {
      current_location: currentLocation,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      current_cycle_used: parseFloat(currentCycleUsed) || 0.0,
      driver_name: driverName,
      tractor_number: tractorNumber,
      trailer_number: trailerNumber,
      carrier_name: carrierName,
      shipping_doc: shippingDoc,
      commodity: commodity,
      start_time: startTime
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/calculate-trip/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error occurred');
      }

      const data = await response.json();
      setRouteData(data);
      setActiveLogDay(0); // Reset to first day of logs
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to connect to backend api');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTrip = async () => {
    if (!routeData) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/save-trip/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip_data: routeData }),
      });
      if (!res.ok) throw new Error('Failed to save trip');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadTripFromHistory = (loadedTripData) => {
    setRouteData(loadedTripData);
    setActiveLogDay(0);
    setActiveTab('logs'); // Automatically open log sheets for loaded trip
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Form */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="2"></circle>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
          </svg>
          <span style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>FleetLog ELD</span>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          <div className="form-group">
            <label>Current Location</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Chicago, IL" 
              value={currentLocation} 
              onChange={(e) => setCurrentLocation(e.target.value)} 
              required
            />
          </div>

          <div className="form-group">
            <label>Pickup Location</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Green Bay, WI" 
              value={pickupLocation} 
              onChange={(e) => setPickupLocation(e.target.value)} 
              required
            />
          </div>

          <div className="form-group">
            <label>Dropoff Location</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Edwardsville, IL" 
              value={dropoffLocation} 
              onChange={(e) => setDropoffLocation(e.target.value)} 
              required
            />
          </div>

          <div className="form-group">
            <label>Cycle Hours Used (70h/8d)</label>
            <input 
              type="number" 
              step="0.1"
              min="0"
              max="70"
              className="form-input" 
              value={currentCycleUsed} 
              onChange={(e) => setCurrentCycleUsed(e.target.value)} 
              required
            />
          </div>

          <div style={{ borderBottom: '1px solid var(--border-color)', margin: '4px 0' }}></div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="form-group">
              <label>Driver Name</label>
              <input type="text" className="form-input" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Tractor #</label>
              <input type="text" className="form-input" value={tractorNumber} onChange={(e) => setTractorNumber(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="form-group">
              <label>Trailer #</label>
              <input type="text" className="form-input" value={trailerNumber} onChange={(e) => setTrailerNumber(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Carrier Name</label>
              <input type="text" className="form-input" value={carrierName} onChange={(e) => setCarrierName(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Start Date & Time</label>
            <input 
              type="datetime-local" 
              className="form-input" 
              value={startTime} 
              onChange={(e) => setStartTime(e.target.value)} 
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="form-group">
              <label>Manifest Doc</label>
              <input type="text" className="form-input" value={shippingDoc} onChange={(e) => setShippingDoc(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Commodity</label>
              <input type="text" className="form-input" value={commodity} onChange={(e) => setCommodity(e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Calculating Route...' : 'Calculate Route & Logs'}
          </button>
        </form>

        {error && (
          <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', fontSize: '13px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="header">
          <div>
            <h1>Hours of Service (HOS) Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>Interactive ELD and Route Planner for Property Carriers</p>
          </div>
          
          <div className="tabs-container">
            <button 
              className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
            >
              🗺️ Map Route
            </button>
            <button 
              className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              ⏱️ Shift Timeline
            </button>
            <button 
              className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              📋 Daily Log Sheets
            </button>
            <button 
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              📜 Trip History
            </button>
          </div>
        </header>

        {/* Status bar for route statistics */}
        {routeData && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', padding: '16px 32px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Total Driving Distance</span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{routeData.summary.total_miles} miles</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Trip Elapsed Time</span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-secondary)', fontFamily: 'var(--font-mono)' }}>{routeData.summary.total_hours} hours</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Final Cycle Hours</span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-success)', fontFamily: 'var(--font-mono)' }}>{routeData.summary.final_cycle_hours} / 70.0 hours</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <button
                className="btn-submit"
                onClick={handleSaveTrip}
                disabled={saving}
                style={{
                  backgroundColor: saveSuccess ? 'var(--accent-success)' : 'var(--accent-primary)',
                  padding: '8px 16px',
                  fontSize: '13px'
                }}
              >
                {saving ? 'Saving...' : saveSuccess ? '✅ Trip Saved!' : '💾 Save Trip'}
              </button>
            </div>
          </div>
        )}

        {/* Active Tab View */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'map' && (
            <MapTab routeData={routeData} />
          )}

          {activeTab === 'timeline' && (
            <TimelineTab routeData={routeData} />
          )}

          {activeTab === 'logs' && (
            routeData ? (
              <div className="log-sheets-container">
                {/* Day selector sub-tabs */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
                  {routeData.daily_logs.map((log, index) => (
                    <button 
                      key={index}
                      className="tab-btn"
                      style={{
                        backgroundColor: activeLogDay === index ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                        color: activeLogDay === index ? '#fff' : 'var(--text-primary)',
                        border: '1.5px solid var(--border-color)',
                      }}
                      onClick={() => setActiveLogDay(index)}
                    >
                      📅 Day {log.day_number} ({log.date})
                    </button>
                  ))}
                </div>
                
                {/* Render the single active Daily Log page */}
                <LogSheet 
                  logData={routeData.daily_logs[activeLogDay]} 
                  metadata={routeData.metadata}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                <h3>No Log Sheets Available. Calculate a route first.</h3>
              </div>
            )
          )}

          {activeTab === 'history' && (
            <TripHistoryTab onLoadTrip={handleLoadTripFromHistory} />
          )}
        </div>
      </main>
    </div>
  );
}

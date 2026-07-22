import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

export default function TripHistoryTab({ onLoadTrip }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/trips/`);
      if (!res.ok) throw new Error('Failed to load trip history');
      const data = await res.json();
      setTrips(data.trips || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this trip from history?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/trips/${id}/delete/`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete trip');
      setTrips(trips.filter(t => t.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSelect = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/trips/${id}/`);
      if (!res.ok) throw new Error('Failed to fetch trip details');
      const tripData = await res.json();
      onLoadTrip(tripData);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        <h3>Loading Saved Trip History...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', color: 'var(--accent-danger)' }}>
        <h3>Failed to load trip history: {error}</h3>
        <button className="btn-submit" onClick={fetchTrips} style={{ marginTop: '12px', width: 'auto' }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '22px' }}>📜 Saved Trip History & Log Book Archive</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0' }}>Review and reload past commercial routes and generated daily ELD logs</p>
        </div>
        <button className="tab-btn" onClick={fetchTrips} style={{ border: '1px solid var(--border-color)' }}>
          🔄 Refresh
        </button>
      </div>

      {trips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
          <h3>No Saved Trips Found</h3>
          <p>Generate a route and click <strong>"💾 Save Trip"</strong> to record it in your digital log book history.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {trips.map((trip) => (
            <div
              key={trip.id}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'grid',
                gridTemplateColumns: '1fr 180px 140px 140px',
                alignItems: 'center',
                gap: '16px',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onClick={() => handleSelect(trip.id)}
            >
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {trip.current_location} ➔ {trip.pickup_location} ➔ {trip.dropoff_location}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  👤 Driver: {trip.driver_name} &nbsp;|&nbsp; 🗓️ Saved on: {trip.created_at}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Distance & Time</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>{trip.total_miles} mi</strong> ({trip.total_hours} hrs)
              </div>

              <div>
                <span className="status-badge status-badge-3">Saved Record #{trip.id}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  className="btn-submit"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={(e) => { e.stopPropagation(); handleSelect(trip.id); }}
                >
                  📜 Load Trip
                </button>
                <button
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: 'var(--accent-danger)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => handleDelete(e, trip.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

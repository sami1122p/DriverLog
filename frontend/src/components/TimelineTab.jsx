import React from 'react';

// Icon helpers based on event description and status
const getTimelineIcon = (desc, status) => {
  if (desc.includes("Pre-Trip") || desc.includes("Post-Trip")) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
      </svg>
    );
  }
  if (desc.includes("Pickup") || desc.includes("Dropoff")) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      </svg>
    );
  }
  if (desc.includes("Fueling")) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 22h12F"></path>
        <path d="M4 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18"></path>
        <circle cx="9" cy="9" r="2"></circle>
      </svg>
    );
  }
  if (desc.includes("30-min")) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
      </svg>
    );
  }
  if (desc.includes("Sleeper")) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4v16"></path>
        <path d="M2 8h18a2 2 0 0 1 2 2v10"></path>
        <path d="M2 17h20"></path>
      </svg>
    );
  }
  if (desc.includes("34-hour")) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
      </svg>
    );
  }
  
  // Driving
  if (status === 3) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="2"></circle>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
      </svg>
    );
  }
  
  // Default Off Duty
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
};

const getStatusName = (status) => {
  switch(status) {
    case 1: return "Off Duty";
    case 2: return "Sleeper Berth";
    case 3: return "Driving";
    case 4: return "On Duty (Not Driving)";
    default: return "Unknown";
  }
};

export default function TimelineTab({ routeData }) {
  if (!routeData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        <h3>No Route Timeline Available</h3>
      </div>
    );
  }

  const { timeline } = routeData;

  return (
    <div className="timeline-list">
      <style>{`
        .timeline-card-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          color: var(--accent-primary);
        }
        .timeline-metrics {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .metric-tag {
          font-size: 11px;
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--text-secondary);
        }
        .timeline-card.driving-card {
          border-left: 3px solid var(--accent-primary);
        }
        .timeline-card.rest-card {
          border-left: 3px solid var(--accent-success);
        }
        .timeline-card.inspection-card {
          border-left: 3px solid var(--accent-warning);
        }
      `}</style>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '0 0 8px' }}>Detailed Trip Timeline</h3>
      {timeline.map((event, index) => {
        const isDriving = event.status === 3;
        const isRest = event.status === 1 || event.status === 2;
        const isInspection = event.description.includes("Inspection");
        
        let cardClass = "";
        if (isDriving) cardClass = "driving-card";
        else if (isRest) cardClass = "rest-card";
        else if (isInspection) cardClass = "inspection-card";

        const startDate = new Date(event.start_time);
        const endDate = new Date(event.end_time);

        return (
          <div key={index} className={`timeline-card ${cardClass}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="timeline-card-icon" style={{
                color: isDriving ? 'var(--accent-primary)' : isRest ? 'var(--accent-success)' : 'var(--accent-warning)'
              }}>
                {getTimelineIcon(event.description, event.status)}
              </div>
              <div className="timeline-time">
                {startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  to {endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
            
            <div className="timeline-details">
              <h4>{event.description}</h4>
              <p>📍 {event.location}</p>
            </div>
            
            <div className="timeline-metrics">
              <span className={`status-badge status-badge-${event.status}`}>
                {getStatusName(event.status)}
              </span>
              <span className="metric-tag">
                ⏳ {event.duration} hrs
              </span>
              <span className="metric-tag">
                🚚 {event.trip_miles} mi
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

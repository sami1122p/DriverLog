import React from 'react';

const getStatusY = (status) => {
  switch (status) {
    case 1: return 25;  // Off Duty
    case 2: return 55;  // Sleeper Berth
    case 3: return 85;  // Driving
    case 4: return 115; // On Duty
    default: return 25;
  }
};

export default function LogSheet({ logData, metadata }) {
  const { day_number, date, events, totals, miles } = logData;
  const {
    driver_name = "John Doe",
    tractor_number = "TRK-101",
    trailer_number = "TRL-202",
    carrier_name = "Apex Logistics",
    shipping_doc = "BOL-992384",
    commodity = "Paper Products"
  } = metadata || {};

  const startX = 100;
  const gridWidth = 720; // 30px per hour
  const gridHeight = 120; // 30px per row
  const endX = startX + gridWidth;

  const getXForMinutes = (minutes) => {
    return startX + (minutes / 1440) * gridWidth;
  };

  // Build the continuous duty line path
  const lineSegments = [];
  let prevX = startX;
  let prevY = events.length > 0 ? getStatusY(events[0].status) : getStatusY(1);

  events.forEach((ev) => {
    const evStartX = getXForMinutes(ev.rel_start_minutes);
    const evEndX = getXForMinutes(ev.rel_end_minutes);
    const currentY = getStatusY(ev.status);

    // If there is a jump in status, draw a vertical transition line
    if (evStartX !== prevX || currentY !== prevY) {
      lineSegments.push({ x1: evStartX, y1: prevY, x2: evStartX, y2: currentY, isTransition: true });
    }

    // Draw horizontal status line
    lineSegments.push({ x1: evStartX, y1: currentY, x2: evEndX, y2: currentY, isTransition: false });

    prevX = evEndX;
    prevY = currentY;
  });

  // Extract change locations for the remarks pointers
  // We only show unique changes to avoid duplicate markers at same minutes
  const statusChanges = [];
  events.forEach((ev, idx) => {
    // If it's a new location or a significant status shift, mark it
    // Except for the very end pad event
    if (idx > 0 && !ev.description.includes("End of Trip")) {
      const prevEv = events[idx - 1];
      if (prevEv.status !== ev.status || prevEv.location !== ev.location) {
        statusChanges.push({
          timeMinutes: ev.rel_start_minutes,
          timeStr: new Date(ev.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          location: ev.location,
          description: ev.description
        });
      }
    }
  });

  // Generate ticks for 24 hours
  const ticks = [];
  for (let h = 0; h <= 24; h++) {
    const x = startX + h * 30;
    ticks.push({ x, hour: h });
  }

  return (
    <div className="log-sheet-card">
      <style>{`
        .log-header {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          border-bottom: 2px solid #000;
          padding-bottom: 12px;
          margin-bottom: 16px;
          font-size: 11px;
        }
        .header-cell {
          display: flex;
          flex-direction: column;
          border-bottom: 1px solid #777;
        }
        .header-cell label {
          font-weight: bold;
          font-size: 9px;
          color: #555;
          text-transform: uppercase;
        }
        .header-cell span {
          font-size: 13px;
          padding: 2px 0;
          min-height: 18px;
        }
        .signature-font {
          font-family: 'Georgia', serif;
          font-style: italic;
          font-weight: 500;
          color: #1e3a8a;
        }
        .totals-column {
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          padding-left: 10px;
          font-weight: bold;
          font-size: 13px;
        }
        .grid-container {
          position: relative;
          margin-bottom: 20px;
        }
        .remarks-header {
          font-weight: bold;
          font-size: 12px;
          border-bottom: 1px solid #000;
          padding-bottom: 4px;
          margin-top: 10px;
          text-transform: uppercase;
        }
        .remarks-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          padding: 8px 0;
          font-size: 11px;
          overflow-y: auto;
          flex: 1;
        }
        .remark-item {
          display: flex;
          gap: 8px;
          border-bottom: 1px dashed #ccc;
          padding: 4px 0;
        }
        .remark-time {
          font-weight: bold;
          color: #3b82f6;
          min-width: 45px;
        }
        .recap-box {
          border: 1px solid #000;
          padding: 8px;
          margin-top: auto;
          font-size: 10px;
          background-color: #f8fafc;
        }
      `}</style>

      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>DRIVER'S DAILY LOG (24 Hours)</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="no-print"
            onClick={() => window.print()}
            style={{
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            🖨️ Print / Save PDF
          </button>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Day {day_number} of Trip</span>
        </div>
      </div>


      {/* Header Info */}
      <div className="log-header">
        <div className="header-cell">
          <label>Date</label>
          <span>{date}</span>
        </div>
        <div className="header-cell">
          <label>Total Miles Driving Today</label>
          <span>{miles || 0} miles</span>
        </div>
        <div className="header-cell">
          <label>Vehicle Numbers (Tractor & Trailer)</label>
          <span>{tractor_number} / {trailer_number}</span>
        </div>
        <div className="header-cell">
          <label>Carrier Name</label>
          <span>{carrier_name}</span>
        </div>
        <div className="header-cell">
          <label>Main Office Address</label>
          <span>Green Bay, WI (Terminal 4)</span>
        </div>
        <div className="header-cell">
          <label>Driver Signature</label>
          <span className="signature-font">{driver_name}</span>
        </div>
        <div className="header-cell">
          <label>Co-Driver Name</label>
          <span>N/A</span>
        </div>
        <div className="header-cell">
          <label>Home Terminal Address</label>
          <span>Chicago, IL Depot</span>
        </div>
        <div className="header-cell">
          <label>Shipping Doc / Manifest No.</label>
          <span>{shipping_doc} ({commodity})</span>
        </div>
      </div>

      {/* Graph Grid Renders using SVG */}
      <div className="grid-container" style={{ display: 'flex' }}>
        <svg width="900" height="150" viewBox="0 0 900 150" style={{ border: '1.5px solid #000', backgroundColor: '#fff' }}>
          {/* Row Headers */}
          <text x="10" y="29" fontFamily="Inter" fontSize="10" fontWeight="bold">1. OFF DUTY</text>
          <text x="10" y="59" fontFamily="Inter" fontSize="10" fontWeight="bold">2. SLEEPER</text>
          <text x="10" y="89" fontFamily="Inter" fontSize="10" fontWeight="bold">3. DRIVING</text>
          <text x="10" y="119" fontFamily="Inter" fontSize="10" fontWeight="bold">4. ON DUTY</text>

          {/* Row Guide Lines */}
          <line x1={startX} y1="25" x2={endX} y2="25" stroke="#ccc" strokeWidth="1" />
          <line x1={startX} y1="55" x2={endX} y2="55" stroke="#ccc" strokeWidth="1" />
          <line x1={startX} y1="85" x2={endX} y2="85" stroke="#ccc" strokeWidth="1" />
          <line x1={startX} y1="115" x2={endX} y2="115" stroke="#ccc" strokeWidth="1" />

          {/* Vertical Grid Hour lines */}
          {ticks.map((t, idx) => {
            const isNoon = t.hour === 12;
            const isMidnight = t.hour === 0 || t.hour === 24;
            let displayHour = t.hour;
            if (t.hour > 12) displayHour = t.hour - 12;
            if (t.hour === 0 || t.hour === 24) displayHour = 'M';
            if (t.hour === 12) displayHour = 'N';

            return (
              <g key={idx}>
                {/* Major grid lines */}
                <line x1={t.x} y1="10" x2={t.x} y2="130" stroke="#000" strokeWidth={isMidnight || isNoon ? 1.5 : 0.75} />
                
                {/* 30-min intermediate line */}
                {t.hour < 24 && (
                  <line x1={t.x + 15} y1="15" x2={t.x + 15} y2="125" stroke="#888" strokeWidth="0.5" strokeDasharray="2,2" />
                )}
                
                {/* 15-min and 45-min minor ticks */}
                {t.hour < 24 && (
                  <>
                    <line x1={t.x + 7.5} y1="20" x2={t.x + 7.5} y2="120" stroke="#aaa" strokeWidth="0.25" />
                    <line x1={t.x + 22.5} y1="20" x2={t.x + 22.5} y2="120" stroke="#aaa" strokeWidth="0.25" />
                  </>
                )}

                {/* Hour Labels */}
                <text x={t.x} y="8" fontFamily="Inter" fontSize="8" textAnchor="middle" fontWeight="bold">
                  {displayHour}
                </text>
                <text x={t.x} y="139" fontFamily="Inter" fontSize="8" textAnchor="middle" fontWeight="bold">
                  {displayHour}
                </text>
              </g>
            );
          })}

          {/* Remarks Connector Lines (Lines from grid bottom down to bottom line) */}
          {statusChanges.map((change, idx) => {
            const x = getXForMinutes(change.timeMinutes);
            return (
              <line 
                key={idx} 
                x1={x} 
                y1="120" 
                x2={x} 
                y2="148" 
                stroke="#3b82f6" 
                strokeWidth="1.5" 
                strokeDasharray="2,2" 
              />
            );
          })}

          {/* Draw Continuous Blue/Black Duty Line */}
          {lineSegments.map((seg, idx) => (
            <line
              key={idx}
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke="#1e3a8a" // dark navy line
              strokeWidth={seg.isTransition ? 1.5 : 3.5}
            />
          ))}
        </svg>

        {/* Right side totals */}
        <div className="totals-column">
          <div style={{ borderBottom: '1px solid #777', width: '45px', textAlign: 'center', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {totals[1].toFixed(1)}
          </div>
          <div style={{ borderBottom: '1px solid #777', width: '45px', textAlign: 'center', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {totals[2].toFixed(1)}
          </div>
          <div style={{ borderBottom: '1px solid #777', width: '45px', textAlign: 'center', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {totals[3].toFixed(1)}
          </div>
          <div style={{ borderBottom: '1px solid #777', width: '45px', textAlign: 'center', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {totals[4].toFixed(1)}
          </div>
          <div style={{ color: '#ef4444', width: '45px', textAlign: 'center', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ={(totals[1]+totals[2]+totals[3]+totals[4]).toFixed(1)}
          </div>
        </div>
      </div>

      {/* Remarks list */}
      <div className="remarks-header">Duty Status Changes & Remarks</div>
      <div className="remarks-grid">
        {statusChanges.length > 0 ? (
          statusChanges.map((change, idx) => (
            <div key={idx} className="remark-item">
              <span className="remark-time">⏱️ {change.timeStr}</span>
              <div>
                <strong>{change.location}</strong>
                <span style={{ color: '#555', marginLeft: '6px' }}>({change.description})</span>
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: 'span 2', color: '#777', fontStyle: 'italic', padding: '8px 0' }}>
            No duty status changes occurred today. (Constant duty status all day).
          </div>
        )}
      </div>

      {/* HOS Compliance Disclaimer */}
      <div className="recap-box">
        <strong>RECAP / SUMMARY FOR TODAY:</strong> Total On-Duty (Line 3 + 4) = <strong>{(totals[3] + totals[4]).toFixed(1)} hours</strong>. Off-Duty + Sleeper Berth (Line 1 + 2) = <strong>{(totals[1] + totals[2]).toFixed(1)} hours</strong>. This log was compiled and verified electronically according to 49 CFR Part 395.
      </div>
    </div>
  );
}

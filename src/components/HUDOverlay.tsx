import { useState, useEffect } from 'react';
import { useSatelliteStore } from '../store/useSatelliteStore';

function formatUTC(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}

export default function HUDOverlay() {
  const satelliteCount = useSatelliteStore((s) => s.satelliteCount);
  const debrisCount = useSatelliteStore((s) => s.debrisCount);
  const stationCount = useSatelliteStore((s) => s.stationCount);
  const isLoading = useSatelliteStore((s) => s.isLoading);
  const [utcTime, setUtcTime] = useState(formatUTC(new Date()));

  useEffect(() => {
    const interval = setInterval(() => {
      setUtcTime(formatUTC(new Date()));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalTracked = satelliteCount + debrisCount + stationCount;

  return (
    <>
      {/* Top Left — Identity & Classification Counts */}
      <div className="hud-top-left">
        <div className="hud-title">AETHON</div>
        <div className="hud-subtitle">PLANETARY INTELLIGENCE CONSTRUCT</div>
        <div className="hud-stats">
          {isLoading ? (
            <div className="hud-stat">
              <span className="hud-stat-label">STATUS</span>
              <span className="hud-stat-value loading">ACQUIRING SIGNAL...</span>
            </div>
          ) : (
            <>
              <div className="hud-stat">
                <span className="hud-stat-dot sat" />
                <span className="hud-stat-label">TRACKED ASSETS</span>
                <span className="hud-stat-value">{satelliteCount.toLocaleString()}</span>
              </div>
              <div className="hud-stat">
                <span className="hud-stat-dot debris" />
                <span className="hud-stat-label">UNREGISTERED</span>
                <span className="hud-stat-value">{debrisCount.toLocaleString()}</span>
              </div>
              <div className="hud-stat">
                <span className="hud-stat-dot station" />
                <span className="hud-stat-label">STATIONS</span>
                <span className="hud-stat-value">{stationCount.toLocaleString()}</span>
              </div>
              <div className="hud-stat total">
                <span className="hud-stat-label">TOTAL CLASSIFIED</span>
                <span className="hud-stat-value">{totalTracked.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Left — System Parameters */}
      <div className="hud-bottom-left">
        <div className="hud-sys-row">
          <span className="hud-sys-label">UTC</span>
          <span className="hud-sys-value mono">{utcTime}</span>
        </div>
        <div className="hud-sys-row">
          <span className="hud-sys-label">PROPAGATION</span>
          <span className="hud-sys-value">SGP4</span>
        </div>
        <div className="hud-sys-row">
          <span className="hud-sys-label">SOURCE</span>
          <span className="hud-sys-value">CELESTRAK TLE</span>
        </div>
      </div>

      {/* Top Right — System State */}
      <div className="hud-top-right">
        <div className="hud-status-indicator">
          <span className="hud-status-dot active" />
          <span className="hud-status-text">CONSTRUCT ACTIVE</span>
        </div>
      </div>

      {/* Corner Brackets */}
      <div className="hud-bracket top-left" />
      <div className="hud-bracket top-right" />
      <div className="hud-bracket bottom-left" />
      <div className="hud-bracket bottom-right" />
    </>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { useSatelliteStore } from '../store/useSatelliteStore';

const typeLabels: Record<string, string> = {
  satellite: 'ACTIVE SATELLITE',
  debris: 'SPACE DEBRIS',
  station: 'SPACE STATION',
};

const typeColors: Record<string, string> = {
  satellite: '#8ec8d4',
  debris: '#c4826a',
  station: '#d4cfc2',
};

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="data-row">
      <span className="data-label">{label}</span>
      <span className="data-value">{value}</span>
    </div>
  );
}

export default function DataCard() {
  const selected = useSatelliteStore((s) => s.selectedSatellite);

  return (
    <AnimatePresence>
      {selected && (
        <motion.div
          className="data-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ borderColor: typeColors[selected.type] + '20' }}
        >
          {/* Header */}
          <div className="data-card-header">
            <div
              className="data-card-type"
              style={{ color: typeColors[selected.type] }}
            >
              <span
                className="type-dot"
                style={{ backgroundColor: typeColors[selected.type] }}
              />
              {typeLabels[selected.type] || 'UNKNOWN'}
            </div>
            <div className="data-card-name">{selected.name}</div>
          </div>

          {/* Divider */}
          <div
            className="data-card-divider"
            style={{
              background: `linear-gradient(90deg, ${typeColors[selected.type]}18, transparent)`,
            }}
          />

          {/* Data */}
          <div className="data-card-body">
            <DataRow label="NORAD ID" value={String(selected.noradId)} />
            <DataRow label="INTL DES" value={selected.intlDesignator || '—'} />
            {selected.alt !== undefined && (
              <DataRow label="ALTITUDE" value={`${selected.alt.toFixed(1)} km`} />
            )}
            {selected.velocity !== undefined && (
              <DataRow
                label="VELOCITY"
                value={`${selected.velocity.toFixed(2)} km/s`}
              />
            )}
            {selected.lat !== undefined && selected.lon !== undefined && (
              <>
                <DataRow
                  label="LATITUDE"
                  value={`${selected.lat.toFixed(4)}°`}
                />
                <DataRow
                  label="LONGITUDE"
                  value={`${selected.lon.toFixed(4)}°`}
                />
              </>
            )}
          </div>

          {/* Footer */}
          <div className="data-card-footer">
            <span className="data-card-footer-text">LIVE TRACKING</span>
            <span className="data-card-footer-dot" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

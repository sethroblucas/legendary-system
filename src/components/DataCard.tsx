import { motion, AnimatePresence } from 'framer-motion';
import { useSatelliteStore } from '../store/useSatelliteStore';

const typeLabels: Record<string, string> = {
  satellite: 'TRACKED ASSET',
  debris: 'UNREGISTERED FRAGMENT',
  station: 'ORBITAL STATION',
};

// Further desaturated for AETHON — quieter palette
const typeColors: Record<string, string> = {
  satellite: '#7ab3be',
  debris: '#b0766a',
  station: '#c4bfb2',
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
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ borderColor: typeColors[selected.type] + '18' }}
        >
          {/* Classification Header */}
          <div className="data-card-header">
            <div className="data-card-section-label">OBJECT CLASSIFICATION</div>
            <div
              className="data-card-type"
              style={{ color: typeColors[selected.type] }}
            >
              <span
                className="type-dot"
                style={{ backgroundColor: typeColors[selected.type] }}
              />
              {typeLabels[selected.type] || 'UNCLASSIFIED'}
            </div>
            <div className="data-card-name">{selected.name}</div>
          </div>

          {/* Divider */}
          <div
            className="data-card-divider"
            style={{
              background: `linear-gradient(90deg, ${typeColors[selected.type]}14, transparent)`,
            }}
          />

          {/* Data */}
          <div className="data-card-body">
            <DataRow label="NORAD ID" value={String(selected.noradId)} />
            <DataRow label="DESIGNATOR" value={selected.intlDesignator || '—'} />
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
            <span className="data-card-footer-text">ACTIVE SURVEILLANCE</span>
            <span className="data-card-footer-dot" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

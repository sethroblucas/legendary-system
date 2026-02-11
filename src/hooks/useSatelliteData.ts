import { useEffect, useRef } from 'react';
import { useSatelliteStore, type SatelliteData } from '../store/useSatelliteStore';

// CelesTrak TLE data URLs
const TLE_SOURCES = {
  stations: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle',
  active: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
  debris: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=cosmos-2251-debris&FORMAT=tle',
};

// Fallback: generate synthetic TLE data for demo if API is unreachable
function generateSyntheticTLEs(): SatelliteData[] {
  const satellites: SatelliteData[] = [];

  // ISS
  satellites.push({
    name: 'ISS (ZARYA)',
    noradId: 25544,
    type: 'station',
    intlDesignator: '98067A',
    tle1: '1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9003',
    tle2: '2 25544  51.6400 208.9163 0006703 274.4781  85.5758 15.49560722999990',
  });

  // Generate active satellites with varied orbits
  for (let i = 0; i < 600; i++) {
    const noradId = 40000 + i;
    const inclination = (20 + Math.random() * 80).toFixed(4).padStart(8, ' ');
    const raan = (Math.random() * 360).toFixed(4).padStart(8, ' ');
    const eccentricity = (Math.random() * 0.02).toFixed(7).substring(2);
    const argPerigee = (Math.random() * 360).toFixed(4).padStart(8, ' ');
    const meanAnomaly = (Math.random() * 360).toFixed(4).padStart(8, ' ');
    const meanMotion = (14.0 + Math.random() * 2).toFixed(8).padStart(11, ' ');

    const line1 = `1 ${String(noradId).padStart(5, '0')}U 20001A   24001.50000000  .00000000  00000-0  00000-0 0  999${i % 10}`;
    const line2 = `2 ${String(noradId).padStart(5, '0')} ${inclination} ${raan} ${eccentricity} ${argPerigee} ${meanAnomaly} ${meanMotion}00001`;

    satellites.push({
      name: `SAT-${noradId}`,
      noradId,
      type: 'satellite',
      intlDesignator: '20001A',
      tle1: line1,
      tle2: line2,
    });
  }

  // Generate debris
  for (let i = 0; i < 400; i++) {
    const noradId = 50000 + i;
    const inclination = (30 + Math.random() * 70).toFixed(4).padStart(8, ' ');
    const raan = (Math.random() * 360).toFixed(4).padStart(8, ' ');
    const eccentricity = (Math.random() * 0.05).toFixed(7).substring(2);
    const argPerigee = (Math.random() * 360).toFixed(4).padStart(8, ' ');
    const meanAnomaly = (Math.random() * 360).toFixed(4).padStart(8, ' ');
    const meanMotion = (13.5 + Math.random() * 2.5).toFixed(8).padStart(11, ' ');

    const line1 = `1 ${String(noradId).padStart(5, '0')}U 99025A   24001.50000000  .00000000  00000-0  00000-0 0  999${i % 10}`;
    const line2 = `2 ${String(noradId).padStart(5, '0')} ${inclination} ${raan} ${eccentricity} ${argPerigee} ${meanAnomaly} ${meanMotion}00001`;

    satellites.push({
      name: `DEB-${noradId}`,
      noradId,
      type: 'debris',
      intlDesignator: '99025A',
      tle1: line1,
      tle2: line2,
    });
  }

  return satellites;
}

function parseTLE(
  text: string,
  type: SatelliteData['type']
): SatelliteData[] {
  const lines = text.trim().split('\n').map((l) => l.trim());
  const satellites: SatelliteData[] = [];

  for (let i = 0; i < lines.length - 2; i += 3) {
    const name = lines[i];
    const tle1 = lines[i + 1];
    const tle2 = lines[i + 2];

    if (!tle1?.startsWith('1 ') || !tle2?.startsWith('2 ')) continue;

    const noradId = parseInt(tle1.substring(2, 7).trim(), 10);
    const intlDesignator = tle1.substring(9, 17).trim();

    // ISS special case
    const satType = name.includes('ISS') ? 'station' as const : type;

    satellites.push({
      name: name.replace(/^0 /, ''),
      noradId,
      type: satType,
      intlDesignator,
      tle1,
      tle2,
    });
  }

  return satellites;
}

async function fetchTLEData(
  url: string,
  type: SatelliteData['type']
): Promise<SatelliteData[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}`);
  const text = await response.text();
  return parseTLE(text, type);
}

export function useSatelliteData() {
  const setSatellites = useSatelliteStore((s) => s.setSatellites);
  const setLoading = useSatelliteStore((s) => s.setLoading);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    async function loadData() {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          fetchTLEData(TLE_SOURCES.stations, 'station'),
          fetchTLEData(TLE_SOURCES.active, 'satellite'),
          fetchTLEData(TLE_SOURCES.debris, 'debris'),
        ]);

        let allSatellites: SatelliteData[] = [];
        let anySuccess = false;

        for (const result of results) {
          if (result.status === 'fulfilled') {
            allSatellites = allSatellites.concat(result.value);
            anySuccess = true;
          }
        }

        if (!anySuccess || allSatellites.length < 10) {
          console.warn('API data insufficient, using synthetic TLE data');
          allSatellites = generateSyntheticTLEs();
        }

        // Limit total to ~1500 for performance
        if (allSatellites.length > 1500) {
          // Keep all stations, sample the rest
          const stations = allSatellites.filter((s) => s.type === 'station');
          const others = allSatellites
            .filter((s) => s.type !== 'station')
            .sort(() => Math.random() - 0.5)
            .slice(0, 1500 - stations.length);
          allSatellites = [...stations, ...others];
        }

        // De-duplicate by NORAD ID
        const seen = new Set<number>();
        allSatellites = allSatellites.filter((s) => {
          if (seen.has(s.noradId)) return false;
          seen.add(s.noradId);
          return true;
        });

        setSatellites(allSatellites);
      } catch (err) {
        console.error('Failed to load TLE data, using synthetic:', err);
        setSatellites(generateSyntheticTLEs());
      }
    }

    loadData();
  }, [setSatellites, setLoading]);
}

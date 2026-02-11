import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLong,
  degreesLat,
  type EciVec3,
} from 'satellite.js';

const EARTH_RADIUS_KM = 6371;
const SCALE_FACTOR = 1 / EARTH_RADIUS_KM; // Normalize so Earth radius = 1 unit

export interface PropagatedPosition {
  x: number;
  y: number;
  z: number;
  lat: number;
  lon: number;
  alt: number; // km
  velocity: number; // km/s
}

export function propagateSatellite(
  tle1: string,
  tle2: string,
  date: Date
): PropagatedPosition | null {
  try {
    const satrec = twoline2satrec(tle1, tle2);
    const result = propagate(satrec, date);
    if (!result) return null;

    const pos = result.position;
    const vel = result.velocity;

    if (typeof pos === 'boolean' || !pos || typeof vel === 'boolean' || !vel) {
      return null;
    }

    const positionEci = pos as EciVec3<number>;
    const velocityEci = vel as EciVec3<number>;

    const gmst = gstime(date);
    const positionGd = eciToGeodetic(positionEci, gmst);

    const lat = degreesLat(positionGd.latitude);
    const lon = degreesLong(positionGd.longitude);
    const alt = positionGd.height; // km above Earth surface

    // Convert ECI km to scene units (Earth radius = 1)
    const r = (EARTH_RADIUS_KM + alt) * SCALE_FACTOR;

    // Convert geodetic to 3D cartesian (lon/lat to x/y/z)
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;

    const x = r * Math.cos(latRad) * Math.cos(lonRad);
    const y = r * Math.sin(latRad);
    const z = -r * Math.cos(latRad) * Math.sin(lonRad);

    // Velocity magnitude
    const velocity = Math.sqrt(
      velocityEci.x ** 2 + velocityEci.y ** 2 + velocityEci.z ** 2
    );

    return { x, y, z, lat, lon, alt, velocity };
  } catch {
    return null;
  }
}

export function propagateOrbitPath(
  tle1: string,
  tle2: string,
  date: Date,
  steps: number = 100,
  periodMinutes: number = 90
): { x: number; y: number; z: number }[] {
  const points: { x: number; y: number; z: number }[] = [];
  const stepMs = (periodMinutes * 60 * 1000) / steps;

  for (let i = 0; i <= steps; i++) {
    const t = new Date(date.getTime() + i * stepMs);
    const pos = propagateSatellite(tle1, tle2, t);
    if (pos) {
      points.push({ x: pos.x, y: pos.y, z: pos.z });
    }
  }

  return points;
}

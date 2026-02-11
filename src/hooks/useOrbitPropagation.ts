import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSatelliteStore, type SatelliteData } from '../store/useSatelliteStore';
import { propagateSatellite } from '../utils/sgp4Helpers';
import * as THREE from 'three';

const BATCH_SIZE = 200; // Propagate N satellites per frame to avoid blocking

export interface SatellitePositions {
  positions: Float32Array;
  colors: Float32Array;
  count: number;
  satelliteMap: Map<number, number>; // noradId -> index
}

// Dune holographic palette — desaturated, luminous
const COLOR_SATELLITE = new THREE.Color('#8ec8d4');
const COLOR_DEBRIS = new THREE.Color('#c4826a');
const COLOR_STATION = new THREE.Color('#d4cfc2');

export function useOrbitPropagation(): React.MutableRefObject<SatellitePositions> {
  const positionsRef = useRef<SatellitePositions>({
    positions: new Float32Array(0),
    colors: new Float32Array(0),
    count: 0,
    satelliteMap: new Map(),
  });

  const batchIndexRef = useRef(0);
  const lastFullUpdateRef = useRef(0);

  const getSatellites = useCallback(() => {
    return useSatelliteStore.getState().satellites;
  }, []);

  useFrame(() => {
    const satellites = getSatellites();
    if (satellites.length === 0) return;

    const now = new Date();
    const count = satellites.length;

    // Initialize arrays if needed
    if (positionsRef.current.positions.length !== count * 3) {
      positionsRef.current.positions = new Float32Array(count * 3);
      positionsRef.current.colors = new Float32Array(count * 3);
      positionsRef.current.count = count;
      positionsRef.current.satelliteMap = new Map();
      satellites.forEach((s, i) => positionsRef.current.satelliteMap.set(s.noradId, i));
      batchIndexRef.current = 0;
    }

    // Process a batch of satellites this frame
    const startIdx = batchIndexRef.current;
    const endIdx = Math.min(startIdx + BATCH_SIZE, count);

    const positions = positionsRef.current.positions;
    const colors = positionsRef.current.colors;

    for (let i = startIdx; i < endIdx; i++) {
      const sat = satellites[i];
      const result = propagateSatellite(
        sat.tle1,
        sat.tle2,
        now
      );

      if (result) {
        const idx3 = i * 3;
        positions[idx3] = result.x;
        positions[idx3 + 1] = result.y;
        positions[idx3 + 2] = result.z;

        // Set color based on type
        let color: THREE.Color;
        if (sat.type === 'station') color = COLOR_STATION;
        else if (sat.type === 'debris') color = COLOR_DEBRIS;
        else color = COLOR_SATELLITE;

        colors[idx3] = color.r;
        colors[idx3 + 1] = color.g;
        colors[idx3 + 2] = color.b;

        // Update store for selected satellite
        const store = useSatelliteStore.getState();
        if (store.selectedSatellite?.noradId === sat.noradId) {
          store.updateSatellitePosition(
            sat.noradId,
            { x: result.x, y: result.y, z: result.z },
            result.lat,
            result.lon,
            result.alt,
            result.velocity
          );
        }
      }
    }

    // Advance batch pointer
    batchIndexRef.current = endIdx >= count ? 0 : endIdx;

    // Track when we complete a full cycle
    if (endIdx >= count) {
      lastFullUpdateRef.current = Date.now();
    }
  });

  return positionsRef;
}

export function getIndexForSatellite(
  posRef: React.MutableRefObject<SatellitePositions>,
  sat: SatelliteData
): number {
  return posRef.current.satelliteMap.get(sat.noradId) ?? -1;
}

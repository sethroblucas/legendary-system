import { useMemo } from 'react';
import * as THREE from 'three';
import { propagateOrbitPath } from '../utils/sgp4Helpers';

interface OrbitPathProps {
  tle1: string;
  tle2: string;
}

export default function OrbitPath({ tle1, tle2 }: OrbitPathProps) {
  const points = useMemo(() => {
    const now = new Date();
    const pathPoints = propagateOrbitPath(tle1, tle2, now, 120, 95);
    return pathPoints.map((p) => new THREE.Vector3(p.x, p.y, p.z));
  }, [tle1, tle2]);

  const geometry = useMemo(() => {
    if (points.length < 2) return null;
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  if (!geometry) return null;

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial
        color="#7ab3be"
        transparent
        opacity={0.09}
        linewidth={1}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </line>
  );
}

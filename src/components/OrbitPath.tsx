import { useMemo } from 'react';
import * as THREE from 'three';
import { propagateOrbitPath } from '../utils/sgp4Helpers';

interface OrbitPathProps {
  tle1: string;
  tle2: string;
}

export default function OrbitPath({ tle1, tle2 }: OrbitPathProps) {
  const lineObj = useMemo(() => {
    const now = new Date();
    const pathPoints = propagateOrbitPath(tle1, tle2, now, 120, 95);
    const points = pathPoints.map((p) => new THREE.Vector3(p.x, p.y, p.z));

    if (points.length < 2) return null;

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: '#7ab3be',
      transparent: true,
      opacity: 0.09,
      linewidth: 1,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const line = new THREE.Line(geometry, material);
    line.renderOrder = 8;
    return line;
  }, [tle1, tle2]);

  if (!lineObj) return null;

  return <primitive object={lineObj} />;
}

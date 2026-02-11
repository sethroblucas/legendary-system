import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function AmbientParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, opacities] = useMemo(() => {
    const count = 1500;
    const pos = new Float32Array(count * 3);
    const op = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Distribute in a large shell around the scene
      const radius = 3 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = radius * Math.cos(phi);

      // Varied opacity — most very faint
      op[i] = 0.08 + Math.random() * 0.25;
    }

    return [pos, op];
  }, []);

  // Gentle drift
  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.002;
      pointsRef.current.rotation.x += delta * 0.001;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#5a6872"
        transparent
        opacity={opacities[0]}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

import { useRef, useCallback, useMemo } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useSatelliteStore } from '../store/useSatelliteStore';
import { useOrbitPropagation } from '../hooks/useOrbitPropagation';
import OrbitPath from './OrbitPath';

// Animated selection highlight — pulsing core + ring + halo
function SelectionHighlight({
  position,
  color,
}: {
  position: { x: number; y: number; z: number };
  color: string;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const pulse = 0.7 + 0.3 * Math.sin(timeRef.current * 2.5);
    const ringPulse = 1.0 + 0.15 * Math.sin(timeRef.current * 1.8);

    if (ringRef.current) {
      ringRef.current.scale.setScalar(ringPulse);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.12 * pulse;
    }
    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.65 + 0.15 * pulse;
    }
  });

  const pos: [number, number, number] = [position.x, position.y, position.z];

  return (
    <group>
      {/* Inner core — bright */}
      <mesh ref={coreRef} position={pos} renderOrder={10}>
        <sphereGeometry args={[0.012, 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.8}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* Pulsing ring */}
      <mesh ref={ringRef} position={pos} renderOrder={11}>
        <ringGeometry args={[0.022, 0.032, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.12}
          toneMapped={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Soft glow halo */}
      <mesh position={pos} renderOrder={9}>
        <sphereGeometry args={[0.028, 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function getTypeColor(type: string): string {
  if (type === 'station') return '#c4bfb2';
  if (type === 'debris') return '#b0766a';
  return '#7ab3be';
}

export default function Satellites() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const positionsRef = useOrbitPropagation();
  const selectSatellite = useSatelliteStore((s) => s.selectSatellite);
  const selectedSatellite = useSatelliteStore((s) => s.selectedSatellite);
  const satellites = useSatelliteStore((s) => s.satellites);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorAttr = useRef<THREE.InstancedBufferAttribute | null>(null);
  const flickerRef = useRef(0);

  // Update instanced mesh positions every frame
  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const posData = positionsRef.current;
    if (!mesh || posData.count === 0) return;

    flickerRef.current += delta;

    const positions = posData.positions;
    const colors = posData.colors;

    for (let i = 0; i < posData.count; i++) {
      const idx3 = i * 3;
      const x = positions[idx3];
      const y = positions[idx3 + 1];
      const z = positions[idx3 + 2];

      if (x === 0 && y === 0 && z === 0) continue;

      dummy.position.set(x, y, z);

      // Very subtle per-node scale flicker
      const flicker = 0.85 + 0.15 * Math.sin(flickerRef.current * 1.2 + i * 0.7);
      dummy.scale.setScalar(flicker);

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    if (colorAttr.current && colors.length > 0) {
      colorAttr.current.array = colors;
      colorAttr.current.needsUpdate = true;
    }
  });

  // Use R3F event's instanceId directly — reliable, no re-raycast
  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      const instanceId = event.instanceId;
      if (instanceId !== undefined && instanceId < satellites.length) {
        selectSatellite(satellites[instanceId]);
      }
    },
    [satellites, selectSatellite]
  );

  const handlePointerMissed = useCallback(() => {
    selectSatellite(null);
  }, [selectSatellite]);

  const count = satellites.length || 1;

  const initialColors = useMemo(() => {
    return new Float32Array(count * 3).fill(0);
  }, [count]);

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        onClick={handleClick}
        onPointerMissed={handlePointerMissed}
        frustumCulled={false}
        renderOrder={5}
      >
        <sphereGeometry args={[0.006, 6, 6]}>
          <instancedBufferAttribute
            ref={colorAttr}
            attach="attributes-color"
            args={[initialColors, 3]}
          />
        </sphereGeometry>
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.7}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>

      {/* Selected satellite — animated highlight + orbit path */}
      {selectedSatellite?.position && (
        <group>
          <SelectionHighlight
            position={selectedSatellite.position}
            color={getTypeColor(selectedSatellite.type)}
          />
          <OrbitPath
            tle1={selectedSatellite.tle1}
            tle2={selectedSatellite.tle2}
          />
        </group>
      )}
    </group>
  );
}

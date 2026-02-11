import { useRef, useCallback, useMemo } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useSatelliteStore } from '../store/useSatelliteStore';
import { useOrbitPropagation } from '../hooks/useOrbitPropagation';
import OrbitPath from './OrbitPath';

export default function Satellites() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const positionsRef = useOrbitPropagation();
  const selectSatellite = useSatelliteStore((s) => s.selectSatellite);
  const selectedSatellite = useSatelliteStore((s) => s.selectedSatellite);
  const satellites = useSatelliteStore((s) => s.satellites);
  const { raycaster } = useThree();

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

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      const mesh = meshRef.current;
      if (!mesh) return;

      const intersects = raycaster.intersectObject(mesh);
      if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
        const instanceId = intersects[0].instanceId;
        if (instanceId < satellites.length) {
          selectSatellite(satellites[instanceId]);
        }
      }
    },
    [raycaster, satellites, selectSatellite]
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

      {/* Selected satellite — soft luminous highlight */}
      {selectedSatellite?.position && (
        <group>
          {/* Inner core */}
          <mesh
            position={[
              selectedSatellite.position.x,
              selectedSatellite.position.y,
              selectedSatellite.position.z,
            ]}
          >
            <sphereGeometry args={[0.012, 12, 12]} />
            <meshBasicMaterial
              color={
                selectedSatellite.type === 'station'
                  ? '#d4cfc2'
                  : selectedSatellite.type === 'debris'
                  ? '#c4826a'
                  : '#8ec8d4'
              }
              transparent
              opacity={0.8}
              toneMapped={false}
            />
          </mesh>

          {/* Outer glow */}
          <mesh
            position={[
              selectedSatellite.position.x,
              selectedSatellite.position.y,
              selectedSatellite.position.z,
            ]}
          >
            <sphereGeometry args={[0.025, 12, 12]} />
            <meshBasicMaterial
              color={
                selectedSatellite.type === 'station'
                  ? '#d4cfc2'
                  : selectedSatellite.type === 'debris'
                  ? '#c4826a'
                  : '#8ec8d4'
              }
              transparent
              opacity={0.15}
              toneMapped={false}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          <OrbitPath
            tle1={selectedSatellite.tle1}
            tle2={selectedSatellite.tle2}
          />
        </group>
      )}
    </group>
  );
}

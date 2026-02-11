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

  // Update instanced mesh positions every frame
  useFrame(() => {
    const mesh = meshRef.current;
    const posData = positionsRef.current;
    if (!mesh || posData.count === 0) return;

    const positions = posData.positions;
    const colors = posData.colors;

    for (let i = 0; i < posData.count; i++) {
      const idx3 = i * 3;
      const x = positions[idx3];
      const y = positions[idx3 + 1];
      const z = positions[idx3 + 2];

      // Skip satellites that haven't been propagated yet
      if (x === 0 && y === 0 && z === 0) continue;

      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    // Update colors
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

      // Get intersection instance ID
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

  // Create initial color array
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
        <sphereGeometry args={[0.008, 6, 6]}>
          <instancedBufferAttribute
            ref={colorAttr}
            attach="attributes-color"
            args={[initialColors, 3]}
          />
        </sphereGeometry>
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.9}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Selected satellite highlight */}
      {selectedSatellite?.position && (
        <group>
          {/* Glow ring */}
          <mesh
            position={[
              selectedSatellite.position.x,
              selectedSatellite.position.y,
              selectedSatellite.position.z,
            ]}
          >
            <sphereGeometry args={[0.018, 16, 16]} />
            <meshBasicMaterial
              color={
                selectedSatellite.type === 'station'
                  ? '#FFFFFF'
                  : selectedSatellite.type === 'debris'
                  ? '#FF6B3B'
                  : '#00F0FF'
              }
              transparent
              opacity={0.35}
              toneMapped={false}
            />
          </mesh>

          {/* Orbit path */}
          <OrbitPath
            tle1={selectedSatellite.tle1}
            tle2={selectedSatellite.tle2}
          />
        </group>
      )}
    </group>
  );
}

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Vignette,
} from '@react-three/postprocessing';
import Earth from './Earth';
import Satellites from './Satellites';
import AmbientParticles from './AmbientParticles';

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#08090c" wireframe />
    </mesh>
  );
}

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0.3, 3.5], fov: 42, near: 0.01, far: 100 }}
      gl={{
        antialias: true,
        toneMapping: 0,
        outputColorSpace: 'srgb',
      }}
      style={{ background: '#08090d' }}
    >
      {/* Minimal lighting — globe is self-illuminated via emissive shaders */}
      <ambientLight intensity={0.02} color="#7a8a9d" />

      {/* Controls — cinematic easing */}
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.03}
        rotateSpeed={0.3}
        minDistance={1.8}
        maxDistance={7}
        zoomSpeed={0.4}
      />

      {/* Scene */}
      <Suspense fallback={<LoadingFallback />}>
        <AmbientParticles />
        <Earth />
        <Satellites />
      </Suspense>

      {/* Postprocessing — restrained bloom + cinematic vignette */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.3}
          luminanceSmoothing={0.95}
          intensity={0.6}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.22} darkness={0.72} />
      </EffectComposer>
    </Canvas>
  );
}

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Earth from './Earth';
import Satellites from './Satellites';
import Stars from './Stars';

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#0a0f1a" wireframe />
    </mesh>
  );
}

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.5], fov: 45, near: 0.01, far: 100 }}
      gl={{
        antialias: true,
        toneMapping: 0, // NoToneMapping
        outputColorSpace: 'srgb',
      }}
      style={{ background: '#05070A' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.08} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-5, -3, -5]} intensity={0.15} color="#00F0FF" />

      {/* Controls */}
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.4}
        minDistance={1.5}
        maxDistance={8}
        zoomSpeed={0.6}
      />

      {/* Scene */}
      <Suspense fallback={<LoadingFallback />}>
        <Stars />
        <Earth />
        <Satellites />
      </Suspense>

      {/* Postprocessing */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          intensity={0.4}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}

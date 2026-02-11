import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- Layer 1: Dark Core Sphere ---
// Opaque — writes depth so transparent shell back-faces are properly occluded
function CoreSphere() {
  return (
    <mesh renderOrder={0}>
      <sphereGeometry args={[0.98, 96, 96]} />
      <meshBasicMaterial color="#06070a" depthWrite />
    </mesh>
  );
}

// --- Layer 2: Holographic Grid Shell ---
function HoloGrid() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewDir;

        void main() {
          // Spherical coords
          float lat = asin(clamp(vPosition.y, -1.0, 1.0));
          float lon = atan(vPosition.z, vPosition.x);

          // Grid lines — 15 degree spacing
          float gridLat = abs(fract(lat * 180.0 / 3.14159265 / 15.0 + 0.5) - 0.5);
          float gridLon = abs(fract(lon * 180.0 / 3.14159265 / 15.0 + 0.5) - 0.5);

          float lineWidth = 0.018;
          float latLine = 1.0 - smoothstep(0.0, lineWidth, gridLat);
          float lonLine = 1.0 - smoothstep(0.0, lineWidth, gridLon);
          float grid = max(latLine, lonLine);

          // Equator + prime meridian emphasis
          float eqLine = 1.0 - smoothstep(0.0, 0.008, abs(lat));
          float pmLine = 1.0 - smoothstep(0.0, 0.008, abs(lon));
          grid = max(grid, max(eqLine * 0.6, pmLine * 0.6));

          // Fresnel for edge glow
          float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.5);

          // Subtle continental hint via noise approximation
          float n1 = sin(vPosition.x * 8.0 + vPosition.y * 6.0) * cos(vPosition.z * 7.0 + vPosition.x * 4.0);
          float n2 = sin(vPosition.y * 12.0 + vPosition.z * 9.0) * cos(vPosition.x * 11.0);
          float landMask = smoothstep(0.1, 0.45, (n1 + n2) * 0.5 + 0.5);

          // Desaturated cyan-white base
          vec3 gridColor = vec3(0.55, 0.72, 0.78);
          // Warm amber tint for land regions
          vec3 landColor = vec3(0.68, 0.60, 0.46);

          vec3 baseColor = mix(gridColor, landColor, landMask * 0.15);

          // --- Subtle AETHON mark etched into projection grid ---
          // Positioned along equatorial band, only visible at grazing angles
          float markLat = smoothstep(0.06, 0.0, abs(lat - 0.15));
          float markLonStart = lon + 0.5; // shift into 0..1ish range
          float ml = fract(markLonStart * 0.5) * 6.0; // 6 character slots

          // Simplified segment-display characters: A E T H O N
          // Each character occupies ml in [i, i+1), with gx as x-coord within char
          float gx = fract(ml);
          float gy = fract((lat - 0.12) * 30.0);
          int charIdx = int(floor(ml));

          float ch = 0.0;
          // Thin vertical/horizontal bars to approximate each letter
          if (charIdx == 0) { // A
            float lBar = step(0.15, gx) * step(gx, 0.2);
            float rBar = step(0.75, gx) * step(gx, 0.8);
            float topBar = step(0.8, gy) * step(0.2, gx) * step(gx, 0.75);
            float midBar = step(0.45, gy) * step(gy, 0.55) * step(0.2, gx) * step(gx, 0.75);
            ch = max(max(lBar, rBar), max(topBar, midBar));
          } else if (charIdx == 1) { // E
            float lBar = step(0.15, gx) * step(gx, 0.2);
            float topBar = step(0.8, gy) * step(0.2, gx) * step(gx, 0.7);
            float midBar = step(0.45, gy) * step(gy, 0.55) * step(0.2, gx) * step(gx, 0.6);
            float botBar = step(gy, 0.15) * step(0.2, gx) * step(gx, 0.7);
            ch = max(max(lBar, topBar), max(midBar, botBar));
          } else if (charIdx == 2) { // T
            float topBar = step(0.8, gy) * step(0.1, gx) * step(gx, 0.85);
            float vBar = step(0.42, gx) * step(gx, 0.52);
            ch = max(topBar, vBar);
          } else if (charIdx == 3) { // H
            float lBar = step(0.15, gx) * step(gx, 0.2);
            float rBar = step(0.75, gx) * step(gx, 0.8);
            float midBar = step(0.45, gy) * step(gy, 0.55) * step(0.2, gx) * step(gx, 0.75);
            ch = max(max(lBar, rBar), midBar);
          } else if (charIdx == 4) { // O
            float lBar = step(0.15, gx) * step(gx, 0.2);
            float rBar = step(0.75, gx) * step(gx, 0.8);
            float topBar = step(0.8, gy) * step(0.2, gx) * step(gx, 0.75);
            float botBar = step(gy, 0.15) * step(0.2, gx) * step(gx, 0.75);
            ch = max(max(lBar, rBar), max(topBar, botBar));
          } else if (charIdx == 5) { // N
            float lBar = step(0.15, gx) * step(gx, 0.2);
            float rBar = step(0.75, gx) * step(gx, 0.8);
            float diag = step(abs(gx - 0.2 - (gy * 0.6)), 0.06);
            ch = max(max(lBar, rBar), diag);
          }

          // Only reveal at grazing Fresnel angles — almost hidden
          float markAlpha = ch * markLat * fresnel * 0.04;

          // Grid luminosity
          float gridAlpha = grid * 0.22 * (0.4 + fresnel * 0.6) + markAlpha;

          // Faint surface fill for land regions
          float surfaceAlpha = landMask * 0.035 * (0.5 + fresnel * 0.5);

          // Fresnel edge glow
          float edgeAlpha = fresnel * 0.12;

          float totalAlpha = gridAlpha + surfaceAlpha + edgeAlpha;

          gl_FragColor = vec4(baseColor, totalAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh renderOrder={1} scale={[1.002, 1.002, 1.002]}>
      <sphereGeometry args={[1, 128, 128]} />
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  );
}

// --- Layer 3: Atmospheric Projection Shell ---
function AtmosphereShell() {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 3.5);
          vec3 color = vec3(0.5, 0.66, 0.72);
          float alpha = fresnel * 0.15;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  return (
    <mesh renderOrder={2} scale={[1.04, 1.04, 1.04]}>
      <sphereGeometry args={[1, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// --- Layer 4: Outer Glow Haze ---
function OuterGlow() {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 4.0);
          vec3 color = vec3(0.45, 0.58, 0.64);
          float alpha = fresnel * 0.06;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  return (
    <mesh renderOrder={3} scale={[1.15, 1.15, 1.15]}>
      <sphereGeometry args={[1, 48, 48]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// --- Layer 5: Rotating Volumetric Noise Field ---
function NoiseField() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewDir;

        // Simple 3D hash
        float hash(vec3 p) {
          p = fract(p * vec3(443.897, 441.423, 437.195));
          p += dot(p, p.yzx + 19.19);
          return fract((p.x + p.y) * p.z);
        }

        float noise(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);

          return mix(
            mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
            f.z
          );
        }

        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.0);

          vec3 noiseCoord = vPosition * 4.0 + vec3(uTime * 0.02, uTime * 0.015, uTime * 0.01);
          float n = noise(noiseCoord) * 0.6 + noise(noiseCoord * 2.0) * 0.3;

          vec3 color = vec3(0.5, 0.6, 0.66);
          float alpha = n * fresnel * 0.05;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.008;
      meshRef.current.rotation.x += delta * 0.003;
    }
  });

  return (
    <mesh ref={meshRef} renderOrder={4} scale={[1.06, 1.06, 1.06]}>
      <sphereGeometry args={[1, 64, 64]} />
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  );
}

// --- Main Earth Hologram ---
export default function Earth() {
  const groupRef = useRef<THREE.Group>(null);

  // Very slow idle drift
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.006;
    }
  });

  return (
    <group ref={groupRef}>
      <CoreSphere />
      <HoloGrid />
      <AtmosphereShell />
      <NoiseField />
      <OuterGlow />
    </group>
  );
}

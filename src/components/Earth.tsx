import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TextureLoader } from 'three';

// Earth textures from public CDN (NASA Blue Marble)
const TEXTURE_BASE = 'https://unpkg.com/three-globe@2.35.0/example/img';

function AtmosphereGlow() {
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.0, 0.94, 1.0, 1.0) * intensity * 0.4;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  return (
    <mesh scale={[1.12, 1.12, 1.12]}>
      <sphereGeometry args={[1, 64, 64]} />
      <primitive object={atmosphereMaterial} attach="material" />
    </mesh>
  );
}

function GridOverlay() {
  const gridMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          // Convert position to spherical coords
          float lat = asin(vPosition.y);
          float lon = atan(vPosition.z, vPosition.x);

          // Grid lines every 15 degrees
          float gridLat = abs(fract(lat * 180.0 / 3.14159 / 15.0 + 0.5) - 0.5);
          float gridLon = abs(fract(lon * 180.0 / 3.14159 / 15.0 + 0.5) - 0.5);

          float lineWidth = 0.02;
          float latLine = 1.0 - smoothstep(0.0, lineWidth, gridLat);
          float lonLine = 1.0 - smoothstep(0.0, lineWidth, gridLon);

          float grid = max(latLine, lonLine);

          // Fresnel edge fade
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 1.5);

          float alpha = grid * 0.08 * (0.3 + fresnel * 0.7);

          gl_FragColor = vec4(0.0, 0.94, 1.0, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    });
  }, []);

  return (
    <mesh scale={[1.003, 1.003, 1.003]}>
      <sphereGeometry args={[1, 128, 128]} />
      <primitive object={gridMaterial} attach="material" />
    </mesh>
  );
}

export default function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  const [dayMap, nightMap, cloudsMap, bumpMap] = useLoader(TextureLoader, [
    `${TEXTURE_BASE}/earth-blue-marble.jpg`,
    `${TEXTURE_BASE}/earth-night.jpg`,
    `${TEXTURE_BASE}/earth-water.png`,
    `${TEXTURE_BASE}/earth-topology.png`,
  ]);

  const earthMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayMap },
        nightTexture: { value: nightMap },
        bumpTexture: { value: bumpMap },
        sunDirection: { value: new THREE.Vector3(5, 3, 5).normalize() },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform sampler2D bumpTexture;
        uniform vec3 sunDirection;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          float NdotL = dot(normal, sunDirection);

          // Day/night blend with smooth transition
          float dayMix = smoothstep(-0.15, 0.25, NdotL);

          vec4 dayColor = texture2D(dayTexture, vUv);
          vec4 nightColor = texture2D(nightTexture, vUv);

          // Dim the day side slightly for tactical feel
          dayColor.rgb *= 0.85;

          // Boost night lights with cyan tint
          nightColor.rgb *= 1.4;
          nightColor.rgb = mix(nightColor.rgb, nightColor.rgb * vec3(0.8, 1.0, 1.0), 0.3);

          vec4 color = mix(nightColor, dayColor, dayMix);

          // Subtle ambient
          color.rgb += vec3(0.01, 0.015, 0.02);

          gl_FragColor = color;
        }
      `,
    });
  }, [dayMap, nightMap, bumpMap]);

  // Slow Earth rotation
  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.01;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.015;
    }
  });

  return (
    <group>
      {/* Earth */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 128, 128]} />
        <primitive object={earthMaterial} attach="material" />
      </mesh>

      {/* Clouds */}
      <mesh ref={cloudsRef} scale={[1.005, 1.005, 1.005]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Grid */}
      <GridOverlay />

      {/* Atmosphere */}
      <AtmosphereGlow />
    </group>
  );
}

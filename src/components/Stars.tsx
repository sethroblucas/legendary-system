import { useMemo } from 'react';

export default function Stars() {
  const [positions, colors] = useMemo(() => {
    const count = 3000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Distribute on a large sphere
      const radius = 40 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = radius * Math.cos(phi);

      // Slight color variation - mostly white with hint of blue
      const brightness = 0.4 + Math.random() * 0.6;
      col[i3] = brightness * (0.9 + Math.random() * 0.1);
      col[i3 + 1] = brightness * (0.9 + Math.random() * 0.1);
      col[i3 + 2] = brightness;
    }

    return [pos, col];
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

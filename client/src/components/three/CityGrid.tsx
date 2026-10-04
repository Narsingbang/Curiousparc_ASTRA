import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function CityGrid({ visible = false }: { visible?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  // Procedural city building blocks
  const buildings = useMemo(() => {
    const list: Array<{ x: number; z: number; height: number; width: number }> = [];
    const gridSize = 6;
    for (let x = -gridSize; x <= gridSize; x += 2) {
      for (let z = -gridSize; z <= gridSize; z += 2) {
        if (Math.abs(x) < 2 && Math.abs(z) < 2) continue; // leave center open
        const height = 0.5 + Math.random() * 2.5;
        list.push({ x, z, height, width: 1.2 });
      }
    }
    return list;
  }, []);

  // Hospital pylons
  const pylons = [
    { x: -3.5, z: -2, height: 3.5, color: '#10B981', name: 'MediSync Central' },
    { x: 3, z: 2.5, height: 2.8, color: '#F59E0B', name: 'Riverside Care' },
    { x: -1, z: 4, height: 2.2, color: '#E11D48', name: 'Northside Clinic' },
  ];

  useFrame((_, delta) => {
    if (groupRef.current && visible) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={[0, -2, -5]}>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#050B1A" roughness={0.8} />
      </mesh>

      {/* Buildings */}
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.height / 2, b.z]}>
          <boxGeometry args={[b.width, b.height, b.width]} />
          <meshStandardMaterial
            color="#0F1B38"
            roughness={0.5}
            metalness={0.2}
            wireframe={false}
          />
        </mesh>
      ))}

      {/* Glowing Hospital Pylons */}
      {pylons.map((p, i) => (
        <group key={`pylon-${i}`} position={[p.x, 0, p.z]}>
          <mesh position={[0, p.height / 2, 0]}>
            <cylinderGeometry args={[0.3, 0.4, p.height, 16]} />
            <meshStandardMaterial
              color={p.color}
              emissive={p.color}
              emissiveIntensity={0.8}
              transparent
              opacity={0.85}
            />
          </mesh>
          {/* Top beacon sphere */}
          <mesh position={[0, p.height + 0.3, 0]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial
              color={p.color}
              emissive={p.color}
              emissiveIntensity={1.2}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

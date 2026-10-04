import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function VaultShield({ visible = false }: { visible?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!visible || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.4;
    const hover = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    groupRef.current.position.y = hover;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={[1.3, 1.3, 1.3]}>
      {/* Outer Hex Shield Ring */}
      <mesh>
        <torusGeometry args={[1.5, 0.08, 16, 6]} />
        <meshStandardMaterial
          color="#22D3EE"
          emissive="#0B5FFF"
          emissiveIntensity={0.8}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Glass Shield Center Face */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.35, 1.35, 0.1, 6]} />
        <meshStandardMaterial
          color="#0B5FFF"
          emissive="#22D3EE"
          emissiveIntensity={0.3}
          transparent
          opacity={0.4}
          roughness={0.1}
          metalness={0.5}
        />
      </mesh>

      {/* Medical Cross Symbol in Center */}
      <group position={[0, 0, 0.1]}>
        <mesh>
          <boxGeometry args={[0.3, 1, 0.1]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.6} />
        </mesh>
        <mesh>
          <boxGeometry args={[1, 0.3, 0.1]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.6} />
        </mesh>
      </group>
    </group>
  );
}

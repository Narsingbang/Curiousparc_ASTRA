import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function NetworkCore({ scrollProgress }: { scrollProgress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.25;
      meshRef.current.rotation.y += delta * 0.35;

      // React to scroll progress: core scales down or splits as user scrolls
      const scale = Math.max(0.6, 1.4 - scrollProgress * 1.5);
      meshRef.current.scale.set(scale, scale, scale);
    }

    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.5;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.08;
      innerRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Outer Wireframe Icosahedron */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[2.2, 1]} />
        <meshStandardMaterial
          color="#0B5FFF"
          emissive="#22D3EE"
          emissiveIntensity={0.6}
          wireframe
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Inner Glowing Holographic Sphere */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[1.1, 32, 32]} />
        <meshStandardMaterial
          color="#22D3EE"
          emissive="#0B5FFF"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}

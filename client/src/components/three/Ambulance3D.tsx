import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Ambulance3D({ visible = false }: { visible?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const redLightRef = useRef<THREE.Mesh>(null);
  const blueLightRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!visible || !groupRef.current) return;

    // Movement loop
    const t = state.clock.elapsedTime * 0.8;
    groupRef.current.position.x = Math.sin(t) * 3;
    groupRef.current.position.z = Math.cos(t) * 3 - 2;
    groupRef.current.rotation.y = -t + Math.PI / 2;

    // Flashing emergency strobe lights
    const flash = Math.sin(state.clock.elapsedTime * 12);
    if (redLightRef.current) {
      const mat = redLightRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = flash > 0 ? 2 : 0.2;
    }
    if (blueLightRef.current) {
      const mat = blueLightRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = flash < 0 ? 2 : 0.2;
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={[0, -0.5, 0]} scale={[0.6, 0.6, 0.6]}>
      {/* Main Body */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.2, 0.9, 2.4]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Red Stripe */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.22, 0.2, 2.42]} />
        <meshStandardMaterial color="#E11D48" roughness={0.3} />
      </mesh>

      {/* Cab / Windshield */}
      <mesh position={[0, 0.8, 0.8]}>
        <boxGeometry args={[1.1, 0.5, 0.7]} />
        <meshStandardMaterial color="#0B5FFF" roughness={0.1} transparent opacity={0.6} />
      </mesh>

      {/* Flashing Lightbar */}
      <group position={[0, 1.15, 0.2]}>
        {/* Red light */}
        <mesh ref={redLightRef} position={[-0.3, 0, 0]}>
          <boxGeometry args={[0.25, 0.12, 0.25]} />
          <meshStandardMaterial
            color="#E11D48"
            emissive="#E11D48"
            emissiveIntensity={1.5}
          />
        </mesh>
        {/* Blue light */}
        <mesh ref={blueLightRef} position={[0.3, 0, 0]}>
          <boxGeometry args={[0.25, 0.12, 0.25]} />
          <meshStandardMaterial
            color="#0B5FFF"
            emissive="#22D3EE"
            emissiveIntensity={1.5}
          />
        </mesh>
      </group>

      {/* Wheels */}
      <mesh position={[-0.6, 0.2, 0.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
      <mesh position={[0.6, 0.2, 0.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
      <mesh position={[-0.6, 0.2, -0.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
      <mesh position={[0.6, 0.2, -0.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
    </group>
  );
}

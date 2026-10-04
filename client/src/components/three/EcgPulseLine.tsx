import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function EcgPulseLine() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Generate procedural ECG heartbeat curve points
  const curve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const width = 14;
    const steps = 120;

    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * width - width / 2;
      let y = 0;

      // Create P-Q-R-S-T wave pulse around x = -1 to +1
      const norm = (x + 1) / 2;
      if (norm >= 0 && norm <= 1) {
        if (norm > 0.1 && norm < 0.25) {
          y = Math.sin((norm - 0.1) * Math.PI * (1 / 0.15)) * 0.4; // P wave
        } else if (norm >= 0.3 && norm < 0.38) {
          y = -0.3; // Q dip
        } else if (norm >= 0.38 && norm < 0.5) {
          y = 1.8; // R peak
        } else if (norm >= 0.5 && norm < 0.58) {
          y = -0.6; // S dip
        } else if (norm >= 0.65 && norm < 0.85) {
          y = Math.sin((norm - 0.65) * Math.PI * (1 / 0.2)) * 0.5; // T wave
        }
      }

      points.push(new THREE.Vector3(x, y - 0.5, 0));
    }

    return new THREE.CatmullRomCurve3(points);
  }, []);

  const tubeGeo = useMemo(() => {
    return new THREE.TubeGeometry(curve, 100, 0.05, 8, false);
  }, [curve]);

  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      const pulse = Math.sin(state.clock.elapsedTime * 4);
      mat.emissiveIntensity = 0.5 + pulse * 0.4;
    }
  });

  return (
    <mesh ref={meshRef} geometry={tubeGeo} position={[0, -0.5, 0.5]}>
      <meshStandardMaterial
        color="#22D3EE"
        emissive="#0B5FFF"
        emissiveIntensity={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

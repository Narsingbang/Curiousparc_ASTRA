import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
import { NetworkCore } from './NetworkCore';
import { EcgPulseLine } from './EcgPulseLine';
import { ParticleRing } from './ParticleRing';
import { CityGrid } from './CityGrid';
import { Ambulance3D } from './Ambulance3D';
import { VaultShield } from './VaultShield';

interface SceneCanvasProps {
  scrollProgress: number; // 0 to 1
}

function SceneContent({ scrollProgress }: { scrollProgress: number }) {
  // Determine chapter states based on scrollProgress
  // Chapter 0 (0 - 0.20): Hero Network Core + ECG + Particles
  // Chapter 1 (0.20 - 0.40): Triage
  // Chapter 2 (0.40 - 0.65): Live Hospital Network City Grid
  // Chapter 3 (0.65 - 0.85): Ambulance 3D
  // Chapter 4 (0.85 - 1.0): Vault Shield

  const showCore = scrollProgress < 0.45;
  const showCity = scrollProgress >= 0.35 && scrollProgress < 0.85;
  const showAmbulance = scrollProgress >= 0.55 && scrollProgress < 0.85;
  const showVault = scrollProgress >= 0.8;

  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#22D3EE" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#0B5FFF" />

      {/* Chapter 0 & 1 */}
      {showCore && (
        <group position={[0, 0, 0]}>
          <NetworkCore scrollProgress={scrollProgress} />
          <EcgPulseLine />
          <ParticleRing count={600} />
        </group>
      )}

      {/* Chapter 2 & 3 */}
      <CityGrid visible={showCity} />
      <Ambulance3D visible={showAmbulance} />

      {/* Chapter 4 */}
      <VaultShield visible={showVault} />
    </>
  );
}

export function SceneCanvas({ scrollProgress }: SceneCanvasProps) {
  useEffect(() => {
    return () => {
      // Clean up Three.js on unmount
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <SceneContent scrollProgress={scrollProgress} />
        </Suspense>
      </Canvas>
    </div>
  );
}

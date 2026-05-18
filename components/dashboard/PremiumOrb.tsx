'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

/**
 * A slowly-rotating gold orb that softly tilts toward the cursor.
 * Distorted icosahedron with a subtle wireframe overlay. Used as the
 * premium hero element on the dashboard. Pure WebGL via R3F, no images.
 */
function Orb() {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Normalize to -1 to 1 across the viewport
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current || !wireRef.current) return;

    // Continuous slow rotation
    meshRef.current.rotation.y += delta * 0.15;
    meshRef.current.rotation.x += delta * 0.05;
    wireRef.current.rotation.y -= delta * 0.08;
    wireRef.current.rotation.x -= delta * 0.04;

    // Tilt toward cursor with damped spring
    const targetX = mouse.y * 0.4;
    const targetY = mouse.x * 0.4;
    meshRef.current.rotation.x += (targetX - meshRef.current.rotation.x) * 0.05;
    meshRef.current.rotation.y += (targetY + meshRef.current.rotation.y * 0) * 0.05;

    // Gentle breathing
    const breath = 1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.04;
    meshRef.current.scale.setScalar(breath);
    wireRef.current.scale.setScalar(breath * 1.08);
  });

  return (
    <group>
      {/* Solid gold orb with soft material */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.2, 4]} />
        <meshStandardMaterial
          color="#c9a548"
          emissive="#7a6228"
          emissiveIntensity={0.6}
          metalness={0.5}
          roughness={0.35}
          flatShading
        />
      </mesh>
      {/* Wireframe shell */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1.32, 2]} />
        <meshBasicMaterial color="#e4c97a" wireframe transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

interface PremiumOrbProps {
  className?: string;
}

export function PremiumOrb({ className = '' }: PremiumOrbProps) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} color="#fff5d6" />
        <pointLight position={[-3, -2, -2]} intensity={0.5} color="#2d6a4f" />
        <Suspense fallback={null}>
          <Orb />
        </Suspense>
      </Canvas>
    </div>
  );
}

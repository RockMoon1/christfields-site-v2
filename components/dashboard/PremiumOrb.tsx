'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

interface OrbCoreProps {
  /** Number of areas the user is tracking. More areas = denser orb. */
  areaCount: number;
  /** Average of the most recent score across areas, 0-10. Drives glow intensity. */
  vitality: number;
}

/**
 * The dashboard orb. A central icosahedron with a wireframe shell, plus one
 * orbiting node per area the user is tracking. As the user adds areas and
 * logs scores, the orb visibly grows and brightens.
 *
 * This is the stripped-down version of the long-term "living web" vision.
 * The next iteration will add lines between nodes, text labels, and per-area
 * size/color driven by the score history.
 */
function OrbCore({ areaCount, vitality }: OrbCoreProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const nodesRef = useRef<THREE.Group>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  // One position on the surface of a sphere for each area, evenly distributed
  // using a Fibonacci lattice.
  const nodePositions = useMemo(() => {
    const out: [number, number, number][] = [];
    const r = 1.55;
    const n = Math.max(areaCount, 0);
    if (n === 0) return out;
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / Math.max(1, n - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = golden * i;
      out.push([
        Math.cos(theta) * radiusAtY * r,
        y * r,
        Math.sin(theta) * radiusAtY * r,
      ]);
    }
    return out;
  }, [areaCount]);

  // Wireframe density scales with area count, clamped so it never gets ugly.
  const wireDetail = Math.min(2 + Math.floor(areaCount / 3), 4);

  // Vitality drives emissive intensity. Higher recent scores = brighter orb.
  const emissive = 0.4 + Math.min(vitality, 10) * 0.06;

  useFrame((state, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.15;
      coreRef.current.rotation.x += delta * 0.05;

      const targetX = mouse.y * 0.4;
      const targetY = mouse.x * 0.4;
      coreRef.current.rotation.x += (targetX - coreRef.current.rotation.x) * 0.05;
      coreRef.current.rotation.y += (targetY - coreRef.current.rotation.y) * 0.05;

      const breath = 1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.04;
      coreRef.current.scale.setScalar(breath);
    }
    if (wireRef.current) {
      wireRef.current.rotation.y -= delta * 0.08;
      wireRef.current.rotation.x -= delta * 0.04;
      const breath = 1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.04;
      wireRef.current.scale.setScalar(breath * 1.08);
    }
    if (nodesRef.current) {
      // Counter-rotate the nodes so they slowly drift around the core.
      nodesRef.current.rotation.y += delta * 0.1;
      nodesRef.current.rotation.x = mouse.y * 0.2;
    }
  });

  return (
    <group>
      {/* Solid core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1.2, wireDetail]} />
        <meshStandardMaterial
          color="#c9a548"
          emissive="#7a6228"
          emissiveIntensity={emissive}
          metalness={0.5}
          roughness={0.35}
          flatShading
        />
      </mesh>
      {/* Wireframe shell */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1.32, wireDetail]} />
        <meshBasicMaterial color="#e4c97a" wireframe transparent opacity={0.18} />
      </mesh>
      {/* Orbiting nodes, one per area */}
      <group ref={nodesRef}>
        {nodePositions.map((pos, i) => (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color="#e4c97a" />
          </mesh>
        ))}
        {/* Faint lines from each node to the center, hinting at the future web */}
        {nodePositions.map((pos, i) => {
          const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(...pos),
          ]);
          return (
            <primitive
              key={`line-${i}`}
              object={
                new THREE.Line(
                  geometry,
                  new THREE.LineBasicMaterial({
                    color: '#c9a548',
                    transparent: true,
                    opacity: 0.12,
                  }),
                )
              }
            />
          );
        })}
      </group>
    </group>
  );
}

interface PremiumOrbProps {
  className?: string;
  /** Number of areas the user is tracking. Drives orb complexity. */
  areaCount?: number;
  /** Average recent score (1-10) across all areas. Drives glow. */
  vitality?: number;
}

export function PremiumOrb({
  className = '',
  areaCount = 0,
  vitality = 0,
}: PremiumOrbProps) {
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
          <OrbCore areaCount={areaCount} vitality={vitality} />
        </Suspense>
      </Canvas>
    </div>
  );
}

'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

export interface OrbArea {
  id: string;
  name: string;
  color: string;
}

interface OrbCoreProps {
  areas: OrbArea[];
  /** Average of the most recent score across areas, 0-10. Drives glow. */
  vitality: number;
}

/**
 * Single orbiting node. Each one knows its area's name and color, scales up
 * smoothly on hover, and shows a small floating label so the user can
 * identify the dot without having to puzzle it out.
 */
function Node({
  position,
  area,
  onHover,
  hovered,
}: {
  position: [number, number, number];
  area: OrbArea;
  onHover: (id: string | null) => void;
  hovered: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current || !glowRef.current) return;
    const target = hovered ? 1.7 : 1;
    meshRef.current.scale.x += (target - meshRef.current.scale.x) * Math.min(1, delta * 12);
    meshRef.current.scale.y = meshRef.current.scale.x;
    meshRef.current.scale.z = meshRef.current.scale.x;

    const glowTarget = hovered ? 2.4 : 1.2;
    glowRef.current.scale.x += (glowTarget - glowRef.current.scale.x) * Math.min(1, delta * 10);
    glowRef.current.scale.y = glowRef.current.scale.x;
    glowRef.current.scale.z = glowRef.current.scale.x;
  });

  return (
    <group position={position}>
      {/* Outer soft glow disc, also colored */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color={area.color} transparent opacity={0.25} />
      </mesh>
      {/* Solid node, interactive */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(area.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.06, 20, 20]} />
        <meshBasicMaterial color={area.color} />
      </mesh>

      {/* Floating label, visible only when hovered */}
      {hovered && (
        <Html
          position={[0, 0.14, 0]}
          center
          distanceFactor={5}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="whitespace-nowrap rounded-sm border bg-black/85 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-ivory backdrop-blur"
            style={{ borderColor: `${area.color}aa`, color: '#f0f2ee' }}
          >
            {area.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function OrbCore({ areas, vitality }: OrbCoreProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const nodesRef = useRef<THREE.Group>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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

  // Fibonacci-lattice positions, evenly distributed on a sphere.
  const nodePositions = useMemo<[number, number, number][]>(() => {
    const out: [number, number, number][] = [];
    const r = 1.55;
    const n = areas.length;
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
  }, [areas.length]);

  const wireDetail = Math.min(2 + Math.floor(areas.length / 3), 4);
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
      // Pause the orbit while the user is hovering a node, so the label
      // does not drift away from the cursor.
      if (!hoveredId) {
        nodesRef.current.rotation.y += delta * 0.1;
      }
      nodesRef.current.rotation.x = mouse.y * 0.2;
    }
  });

  return (
    <group>
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
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1.32, wireDetail]} />
        <meshBasicMaterial color="#e4c97a" wireframe transparent opacity={0.18} />
      </mesh>

      {/* Orbiting colored nodes with hover labels */}
      <group ref={nodesRef}>
        {areas.map((area, i) => {
          const pos = nodePositions[i];
          if (!pos) return null;
          return (
            <Node
              key={area.id}
              position={pos}
              area={area}
              hovered={hoveredId === area.id}
              onHover={setHoveredId}
            />
          );
        })}

        {/* Faint lines from each node back to the core */}
        {nodePositions.map((pos, i) => {
          const area = areas[i];
          if (!area) return null;
          const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(...pos),
          ]);
          return (
            <primitive
              key={`line-${area.id}`}
              object={
                new THREE.Line(
                  geometry,
                  new THREE.LineBasicMaterial({
                    color: new THREE.Color(area.color),
                    transparent: true,
                    opacity: 0.18,
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
  areas?: OrbArea[];
  vitality?: number;
}

export function PremiumOrb({
  className = '',
  areas = [],
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
          <OrbCore areas={areas} vitality={vitality} />
        </Suspense>
      </Canvas>
    </div>
  );
}

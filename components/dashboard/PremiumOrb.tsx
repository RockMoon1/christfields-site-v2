'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
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
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color={area.color} transparent opacity={0.25} />
      </mesh>
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

/**
 * The Christ Fields logo mark, rendered as a 3D plane in WebGL. Slowly
 * rotates around the Y axis, tilts toward the cursor, and breathes very
 * slightly. The PNG is alpha-mapped so the plane itself is invisible — only
 * the flame mark shows, like a stamp floating in space.
 *
 * Areas orbit around it as small colored nodes with hover labels, same as
 * the previous icosahedron version.
 */
function LogoMark({ areas, vitality }: OrbCoreProps) {
  const markRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const nodesRef = useRef<THREE.Group>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Load the logo PNG once. drei's useTexture suspends until ready.
  const logoTex = useTexture('/assets/logo.png');
  // Make sure colors render correctly through the standard material.
  logoTex.colorSpace = THREE.SRGBColorSpace;
  logoTex.anisotropy = 8;

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

  // Fibonacci-lattice positions for the orbiting area nodes.
  const nodePositions = useMemo<[number, number, number][]>(() => {
    const out: [number, number, number][] = [];
    const r = 1.85;
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

  // Wireframe density scales with area count, clamped so it never gets ugly.
  const wireDetail = Math.min(2 + Math.floor(areas.length / 3), 4);

  // Higher average score = brighter emissive glow.
  const emissive = 0.5 + Math.min(vitality, 10) * 0.07;

  useFrame((state, delta) => {
    if (markRef.current) {
      // Continuous slow rotation around Y. The plane is double-sided so the
      // back is visible too (logo appears mirrored when it faces away).
      markRef.current.rotation.y += delta * 0.35;

      // Mouse tilt on X axis (vertical mouse movement = vertical tilt).
      const targetX = mouse.y * 0.35;
      markRef.current.rotation.x += (targetX - markRef.current.rotation.x) * 0.06;

      // Soft floating up/down + breathing scale.
      const t = state.clock.elapsedTime;
      markRef.current.position.y = Math.sin(t * 0.5) * 0.08;
      const breath = 1 + Math.sin(t * 0.6) * 0.03;
      markRef.current.scale.setScalar(breath);
    }

    if (haloRef.current) {
      const t = state.clock.elapsedTime;
      const pulse = 1 + Math.sin(t * 1.2) * 0.06;
      haloRef.current.scale.setScalar(pulse);
    }

    if (wireRef.current) {
      // Slowly counter-rotate the wireframe cage so it feels like a living
      // shell around the mark. Mouse tilt is also applied so the whole orb
      // leans toward the cursor in unison.
      wireRef.current.rotation.y -= delta * 0.08;
      wireRef.current.rotation.x -= delta * 0.04;
      const t = state.clock.elapsedTime;
      const breath = 1 + Math.sin(t * 0.6) * 0.04;
      wireRef.current.scale.setScalar(breath * 1.08);
    }

    if (nodesRef.current) {
      // Pause the orbit while the user is hovering a node, so the label
      // stays under the cursor.
      if (!hoveredId) {
        nodesRef.current.rotation.y += delta * 0.1;
      }
      nodesRef.current.rotation.x = mouse.y * 0.2;
    }
  });

  return (
    <group>
      {/* Soft gold halo behind the mark — gives it depth and warmth. */}
      <mesh ref={haloRef} position={[0, 0, -0.3]}>
        <circleGeometry args={[1.5, 48]} />
        <meshBasicMaterial color="#c9a548" transparent opacity={0.07} />
      </mesh>

      {/* The mark itself. Alpha-mapped plane, double-sided. */}
      <mesh ref={markRef}>
        <planeGeometry args={[2.0, 2.0]} />
        <meshStandardMaterial
          map={logoTex}
          alphaMap={logoTex}
          transparent
          alphaTest={0.05}
          side={THREE.DoubleSide}
          emissive="#c9a548"
          emissiveMap={logoTex}
          emissiveIntensity={emissive}
          metalness={0.35}
          roughness={0.45}
        />
      </mesh>

      {/* Wireframe cage around the mark. The webbing the user wants to keep. */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1.55, wireDetail]} />
        <meshBasicMaterial color="#e4c97a" wireframe transparent opacity={0.18} />
      </mesh>

      {/* Orbiting area nodes with hover labels */}
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
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} color="#fff5d6" />
        <pointLight position={[-3, -2, -2]} intensity={0.5} color="#2d6a4f" />
        <Suspense fallback={null}>
          <LogoMark areas={areas} vitality={vitality} />
        </Suspense>
      </Canvas>
    </div>
  );
}

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
 * Orbiting point light. Creates a dynamic specular highlight that sweeps
 * across the metallic mark as it rotates, giving the spinning logo a
 * cinematic flash of light effect.
 */
function SweepLight() {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (!lightRef.current) return;
    const t = state.clock.elapsedTime;
    lightRef.current.position.x = Math.cos(t * 0.5) * 4;
    lightRef.current.position.z = Math.sin(t * 0.5) * 4 + 2;
    lightRef.current.position.y = Math.sin(t * 0.35) * 1.5;
  });

  return <pointLight ref={lightRef} color="#fff8d6" intensity={6} distance={12} />;
}

/**
 * The Christ Fields logo mark, rendered as a 3D box in WebGL so it has real
 * thickness. The logo PNG is alpha-mapped onto the front and back faces
 * (cropped in code so the "Christ Fields" wordmark below the cross is
 * excluded). The four side faces are dark metallic gold, creating a
 * medallion / stamp feel.
 *
 * Material is a PhysicalMaterial with clearcoat, so light catches the
 * surface dramatically. Combined with the orbiting SweepLight, the mark
 * gets a true "flash of light" as it rotates.
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
  logoTex.colorSpace = THREE.SRGBColorSpace;
  logoTex.anisotropy = 16;
  logoTex.minFilter = THREE.LinearMipmapLinearFilter;
  logoTex.magFilter = THREE.LinearFilter;
  // Crop the texture vertically so only the top portion (cross + flame mark)
  // is visible. The bottom of the PNG contains the "ChristFields" wordmark
  // which we do not want on the 3D mark.
  logoTex.offset.set(0, 0.4);
  logoTex.repeat.set(1, 0.6);

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

  const wireDetail = Math.min(2 + Math.floor(areas.length / 3), 4);
  const emissive = 0.45 + Math.min(vitality, 10) * 0.05;

  // Build the materials array for the box: [right, left, top, bottom, front, back].
  // Front and back show the cropped logo; sides are a dark metallic gold edge.
  const materials = useMemo(() => {
    const side = new THREE.MeshPhysicalMaterial({
      color: '#6e5520',
      metalness: 1,
      roughness: 0.25,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
    });
    const front = new THREE.MeshPhysicalMaterial({
      map: logoTex,
      alphaMap: logoTex,
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide,
      metalness: 0.85,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      emissive: new THREE.Color('#c9a548'),
      emissiveMap: logoTex,
      emissiveIntensity: emissive,
    });
    return [side, side, side, side, front, front];
  }, [logoTex, emissive]);

  useFrame((state, delta) => {
    if (markRef.current) {
      markRef.current.rotation.y += delta * 0.45;

      const targetX = mouse.y * 0.35;
      markRef.current.rotation.x += (targetX - markRef.current.rotation.x) * 0.06;

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
      wireRef.current.rotation.y -= delta * 0.08;
      wireRef.current.rotation.x -= delta * 0.04;
      const t = state.clock.elapsedTime;
      const breath = 1 + Math.sin(t * 0.6) * 0.04;
      wireRef.current.scale.setScalar(breath * 1.08);
    }

    if (nodesRef.current) {
      if (!hoveredId) {
        nodesRef.current.rotation.y += delta * 0.1;
      }
      nodesRef.current.rotation.x = mouse.y * 0.2;
    }
  });

  return (
    <group>
      {/* Soft gold halo behind the mark — depth and warmth. */}
      <mesh ref={haloRef} position={[0, 0, -0.4]}>
        <circleGeometry args={[1.5, 64]} />
        <meshBasicMaterial color="#c9a548" transparent opacity={0.08} />
      </mesh>

      {/* Truly 3D mark: thin box with the logo on front and back, metallic
          gold edges, clearcoat for that wet-shine catch-the-light look. */}
      <mesh ref={markRef} material={materials} castShadow>
        <boxGeometry args={[1.9, 1.9, 0.18]} />
      </mesh>

      {/* Wireframe cage stays — the webbing around the mark. */}
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
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        // Bump device pixel ratio for sharper output. Capped at 3 so we do
        // not melt phone GPUs on hi-DPI screens.
        dpr={[1.5, 3]}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 5]} intensity={1.4} color="#fff5d6" />
        <pointLight position={[-3, -2, -2]} intensity={0.5} color="#2d6a4f" />
        <SweepLight />
        <Suspense fallback={null}>
          <LogoMark areas={areas} vitality={vitality} />
        </Suspense>
      </Canvas>
    </div>
  );
}

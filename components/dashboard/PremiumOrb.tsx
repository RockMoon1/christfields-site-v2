'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

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
  const markGroupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const nodesRef = useRef<THREE.Group>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Plane segment count for the displacement-mapped logo. Held stable so we
  // never remount the geometry mid-life from a viewport change. 96 is the
  // sweet spot: visibly smooth displacement, still light enough for mobile.
  const planeSegments = 96;

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

  // The card itself. Warmer, brighter gold than before so the logo on top
  // reads vivid against it instead of muted.
  const cardMaterials = useMemo(() => {
    const face = new THREE.MeshPhysicalMaterial({
      color: '#a8843a',
      metalness: 1,
      roughness: 0.3,
      clearcoat: 0.85,
      clearcoatRoughness: 0.18,
    });
    const edge = new THREE.MeshPhysicalMaterial({
      color: '#7a6228',
      metalness: 1,
      roughness: 0.2,
      clearcoat: 0.9,
      clearcoatRoughness: 0.12,
    });
    // [right, left, top, bottom, front, back]
    return [edge, edge, edge, edge, face, face];
  }, []);

  // The 3D logo material. Same texture as map, alphaMap, AND displacementMap
  // so the bright cross/flame pixels push their plane vertices forward,
  // turning a flat decal into real extrusion. Higher emissive than before
  // so the logo glows confidently against the now-brighter card.
  const logoMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      map: logoTex,
      alphaMap: logoTex,
      transparent: true,
      alphaTest: 0.05,
      displacementMap: logoTex,
      displacementScale: 0.18,
      side: THREE.DoubleSide,
      metalness: 0.9,
      roughness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      color: new THREE.Color('#f3d97a'),
      emissive: new THREE.Color('#e4c97a'),
      emissiveMap: logoTex,
      emissiveIntensity: emissive + 0.4,
    });
  }, [logoTex, emissive]);

  useFrame((state, delta) => {
    if (markGroupRef.current) {
      // Rotate the whole mark group (card + both 3D logo planes together).
      markGroupRef.current.rotation.y += delta * 0.45;

      const targetX = mouse.y * 0.35;
      markGroupRef.current.rotation.x +=
        (targetX - markGroupRef.current.rotation.x) * 0.06;

      const t = state.clock.elapsedTime;
      markGroupRef.current.position.y = Math.sin(t * 0.5) * 0.08;
      const breath = 1 + Math.sin(t * 0.6) * 0.03;
      markGroupRef.current.scale.setScalar(breath);
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

      {/* Card + truly 3D logo. Card is a thin metallic gold box; logo lives
          on two high-segment planes (front and back) using displacementMap
          so the cross and flame extrude as real geometry, not a flat decal. */}
      <group ref={markGroupRef}>
        {/* The card itself, gold metallic, no logo painted on. */}
        <mesh material={cardMaterials} castShadow>
          <boxGeometry args={[1.9, 1.9, 0.18]} />
        </mesh>

        {/* Front-face 3D logo. Plane subdivisions tuned by device — 160 on
            desktop for smooth displacement, 80 on mobile to halve the vertex
            count and keep GPUs happy. */}
        <mesh position={[0, 0, 0.092]} material={logoMaterial}>
          <planeGeometry args={[1.7, 1.7, planeSegments, planeSegments]} />
        </mesh>

        {/* Back-face 3D logo, rotated 180 so the cross faces outward there too. */}
        <mesh
          position={[0, 0, -0.092]}
          rotation={[0, Math.PI, 0]}
          material={logoMaterial}
        >
          <planeGeometry args={[1.7, 1.7, planeSegments, planeSegments]} />
        </mesh>
      </group>

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
  const isMobile = useIsMobile();

  return (
    <div className={className}>
      {/* IMPORTANT: Canvas props (gl, dpr) are STABLE — they never depend on
          isMobile. R3F can throw if its renderer's DPR or context options
          change after mount, and that was the cause of the "We could not
          load this page" error on small viewports.
          We still downgrade visuals on mobile by passing isMobile DOWN into
          the scene (LogoMark uses it for plane segments, SweepLight is
          conditional), which only changes the scene graph, not the renderer. */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 4, 5]} intensity={1.8} color="#fff5d6" />
        <pointLight position={[-3, -2, -2]} intensity={0.6} color="#2d6a4f" />
        {/* SweepLight is a moving PointLight that creates the cinematic
            highlight flash on the metallic mark. Skip it on phones — it
            forces per-frame shading recompute on the clearcoat material. */}
        {!isMobile && <SweepLight />}
        <Suspense fallback={null}>
          <LogoMark areas={areas} vitality={vitality} />
        </Suspense>
      </Canvas>
    </div>
  );
}

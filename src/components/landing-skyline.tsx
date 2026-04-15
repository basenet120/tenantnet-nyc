"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";

/**
 * Brutalist low-poly NYC tenement skyline that scrolls sideways forever.
 * Orthographic camera for that flat civic-poster look.
 * Windows animate in over the first few seconds, then occasional flickers.
 * Foggy/translucent so hero text stays readable on top.
 */

type Building = {
  x: number;
  width: number;
  height: number;
  depth: number;
  windowCols: number;
  windowRows: number;
  hasCornice: boolean;
};

const CHARCOAL_LIGHT = "#2a2a2a";
const CHARCOAL_DARKER = "#0e0e0e";
const TERRACOTTA = "#c45d3e";
const AMBER = "#d4a843";
const OFFWHITE = "#f5f0eb";
const FOG_COLOR = "#1a1a1a";

function generateBuildings(count: number, seed: number): { buildings: Building[]; totalWidth: number } {
  const buildings: Building[] = [];
  let x = 0;
  const rng = mulberry32(seed);

  for (let i = 0; i < count; i++) {
    const width = 2.2 + rng() * 1.4;
    const height = 5 + rng() * 7;
    const depth = 1.2 + rng() * 0.6;
    const windowCols = Math.max(2, Math.floor(width * 1.4));
    const windowRows = Math.max(3, Math.floor(height * 1.0));
    buildings.push({
      x: x + width / 2,
      width,
      height,
      depth,
      windowCols,
      windowRows,
      hasCornice: rng() > 0.35,
    });
    x += width + 0.15;
  }
  return { buildings, totalWidth: x };
}

type Skyscraper = {
  x: number;
  width: number;
  height: number;
  windowCols: number;
  windowRows: number;
};

function generateSkyscrapers(count: number, seed: number): { skyscrapers: Skyscraper[]; totalWidth: number } {
  const skyscrapers: Skyscraper[] = [];
  let x = 0;
  const rng = mulberry32(seed);

  for (let i = 0; i < count; i++) {
    // Skyscrapers: narrower and much taller than tenements
    const width = 1.6 + rng() * 1.0;
    const height = 14 + rng() * 12;
    const windowCols = Math.max(2, Math.floor(width * 1.6));
    const windowRows = Math.max(8, Math.floor(height * 1.2));
    skyscrapers.push({
      x: x + width / 2,
      width,
      height,
      windowCols,
      windowRows,
    });
    // Closer spacing so skyscrapers cluster
    x += width + 0.5 + rng() * 0.8;
  }
  return { skyscrapers, totalWidth: x };
}

// Deterministic PRNG so the skyline shape is consistent across SSR/hydration
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type WindowSlot = { col: number; row: number; initiallyLit: boolean; color: string };

function BuildingMesh({
  building,
  index,
  toggledKeys,
}: {
  building: Building;
  index: number;
  toggledKeys: Set<string>;
}) {
  const { width, height, depth, windowCols, windowRows, hasCornice } = building;

  // Pre-compute EVERY window slot (lit or not) with stable color so toggles
  // can flip any slot on or off at runtime.
  const slots = useMemo<WindowSlot[]>(() => {
    const rng = mulberry32(index * 9973 + 13);
    const arr: WindowSlot[] = [];
    for (let c = 0; c < windowCols; c++) {
      for (let r = 0; r < windowRows; r++) {
        const initiallyLit = rng() > 0.55;
        const pick = rng();
        const color = pick < 0.7 ? AMBER : pick < 0.85 ? TERRACOTTA : OFFWHITE;
        arr.push({ col: c, row: r, initiallyLit, color });
      }
    }
    return arr;
  }, [index, windowCols, windowRows]);

  const windowW = (width * 0.8) / windowCols;
  const windowH = (height * 0.75) / windowRows;
  const gapX = (width - windowW * windowCols) / (windowCols + 1);
  const gapY = (height - windowH * windowRows) / (windowRows + 1);

  return (
    <group position={[building.x, height / 2, 0]}>
      {/* Main building body */}
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={CHARCOAL_LIGHT} roughness={0.95} />
      </mesh>

      {/* Top cornice / cap in terracotta */}
      {hasCornice && (
        <mesh position={[0, height / 2 + 0.15, 0]}>
          <boxGeometry args={[width + 0.08, 0.3, depth + 0.08]} />
          <meshStandardMaterial color={TERRACOTTA} roughness={0.8} />
        </mesh>
      )}

      {/* Base slab */}
      <mesh position={[0, -height / 2 + 0.25, 0]}>
        <boxGeometry args={[width + 0.05, 0.5, depth + 0.05]} />
        <meshStandardMaterial color={CHARCOAL_DARKER} roughness={1} />
      </mesh>

      {/* Windows grid — rendered only if currently lit (XOR with toggle map) */}
      {slots.map((w, i) => {
        const key = `${index}-${w.col}-${w.row}`;
        const isLit = toggledKeys.has(key) ? !w.initiallyLit : w.initiallyLit;
        if (!isLit) return null;
        const xPos = -width / 2 + gapX + w.col * (windowW + gapX) + windowW / 2;
        const yPos = -height / 2 + gapY + w.row * (windowH + gapY) + windowH / 2 + 0.4;
        return (
          <mesh key={i} position={[xPos, yPos, depth / 2 + 0.01]}>
            <planeGeometry args={[windowW * 0.82, windowH * 0.7]} />
            <meshBasicMaterial
              color={w.color}
              transparent
              opacity={0.92}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Slim skyscraper silhouette for the background layer. Simpler than
 * BuildingMesh — no cornice, no base slab, more uniform window grid,
 * darker tone for atmospheric perspective.
 */
function SkyscraperMesh({ tower, index }: { tower: Skyscraper; index: number }) {
  const { width, height, windowCols, windowRows } = tower;

  const slots = useMemo(() => {
    const rng = mulberry32(index * 7919 + 31);
    const arr: { col: number; row: number; lit: boolean; color: string }[] = [];
    for (let c = 0; c < windowCols; c++) {
      for (let r = 0; r < windowRows; r++) {
        const lit = rng() > 0.6; // slightly fewer lit than tenements
        const pick = rng();
        // Skyscraper windows skew cooler/dimmer
        const color = pick < 0.78 ? AMBER : pick < 0.92 ? OFFWHITE : TERRACOTTA;
        arr.push({ col: c, row: r, lit, color });
      }
    }
    return arr;
  }, [index, windowCols, windowRows]);

  const windowW = (width * 0.78) / windowCols;
  const windowH = (height * 0.85) / windowRows;
  const gapX = (width - windowW * windowCols) / (windowCols + 1);
  const gapY = (height - windowH * windowRows) / (windowRows + 1);

  return (
    <group position={[tower.x, height / 2, 0]}>
      {/* Slim tower body — darker than foreground tenements */}
      <mesh>
        <boxGeometry args={[width, height, 0.6]} />
        <meshStandardMaterial color={CHARCOAL_DARKER} roughness={0.95} />
      </mesh>

      {/* Windows */}
      {slots.map((w, i) => {
        if (!w.lit) return null;
        const xPos = -width / 2 + gapX + w.col * (windowW + gapX) + windowW / 2;
        const yPos = -height / 2 + gapY + w.row * (windowH + gapY) + windowH / 2;
        return (
          <mesh key={i} position={[xPos, yPos, 0.31]}>
            <planeGeometry args={[windowW * 0.7, windowH * 0.55]} />
            <meshBasicMaterial
              color={w.color}
              transparent
              opacity={0.55}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Background layer of skyscrapers — taller, slimmer, dimmer, sits behind
 * the main brutalist tenements to add depth/atmosphere.
 */
function BackgroundSkyscrapers() {
  const { viewport } = useThree();

  const skyscrapers = useMemo(() => {
    const count = Math.max(8, Math.ceil(viewport.width / 14) + 3);
    return generateSkyscrapers(count, 9241).skyscrapers;
  }, [viewport.width]);

  const totalWidth = useMemo(
    () =>
      skyscrapers.length > 0
        ? skyscrapers[skyscrapers.length - 1].x + skyscrapers[skyscrapers.length - 1].width / 2
        : 0,
    [skyscrapers],
  );

  // Slightly smaller scale than foreground (suggests distance) and pushed
  // back in z so atmospheric fog dims them
  const scale = Math.min(2.0, viewport.width / 42);

  return (
    <group
      position={[-(totalWidth * scale) / 2, -viewport.height / 2 + 0.5, -3]}
      scale={[scale, scale, scale]}
    >
      {skyscrapers.map((s, i) => (
        <SkyscraperMesh key={i} tower={s} index={i} />
      ))}
    </group>
  );
}

/**
 * Shared timer hook: returns elapsed seconds since mount.
 */
function useElapsed() {
  const ref = useRef(0);
  useFrame((_, delta) => {
    ref.current += delta;
  });
  return ref;
}

/**
 * Plane — long fuselage, small tail fin, flies leftward across the sky
 * occasionally (once every 25-55s on average).
 */
function Plane() {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const elapsed = useElapsed();
  const stateRef = useRef({
    active: false,
    x: 0,
    y: 0,
    speed: 0,
    nextSpawnAt: 0, // first plane spawns immediately at t=0
  });

  useFrame((_, delta) => {
    const s = stateRef.current;
    const margin = Math.max(viewport.width, 20) / 2 + 10;

    if (!s.active) {
      if (elapsed.current >= s.nextSpawnAt) {
        s.active = true;
        s.x = margin; // start off-screen right
        s.y = 8 + Math.random() * 2; // high upper sky band, above text
        s.speed = 2.4 + Math.random() * 0.8;
      }
    } else {
      s.x -= delta * s.speed;
      if (s.x < -margin) {
        s.active = false;
        // 1.5x more frequent: previous 25-55s -> now ~17-37s
        s.nextSpawnAt = elapsed.current + 17 + Math.random() * 20;
      }
    }

    if (groupRef.current) {
      groupRef.current.visible = s.active;
      groupRef.current.position.set(s.x, s.y, 1);
    }
  });

  // 2.5x scale on the plane group
  return (
    <group ref={groupRef} visible={false} scale={[2.5, 2.5, 2.5]}>
      <mesh>
        <boxGeometry args={[1.4, 0.16, 0.16]} />
        <meshBasicMaterial color={OFFWHITE} toneMapped={false} />
      </mesh>
      <mesh position={[-0.75, 0, 0]}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshBasicMaterial color={OFFWHITE} toneMapped={false} />
      </mesh>
      <mesh position={[0.05, -0.05, 0]}>
        <boxGeometry args={[0.5, 0.04, 0.8]} />
        <meshBasicMaterial color={OFFWHITE} toneMapped={false} />
      </mesh>
      <mesh position={[0.6, 0.18, 0]}>
        <boxGeometry args={[0.2, 0.28, 0.06]} />
        <meshBasicMaterial color={TERRACOTTA} toneMapped={false} />
      </mesh>
      <mesh position={[1.4, 0, 0]}>
        <planeGeometry args={[1.8, 0.06]} />
        <meshBasicMaterial color={OFFWHITE} transparent opacity={0.18} toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * Helicopter — chunky body, tail boom, spinning top rotor, flies rightward
 * (opposite of the plane) at a lower altitude.
 */
function Helicopter() {
  const groupRef = useRef<THREE.Group>(null);
  const rotorRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  const elapsed = useElapsed();
  const stateRef = useRef({
    active: false,
    x: 0,
    y: 0,
    speed: 0,
    nextSpawnAt: 12 + Math.random() * 10, // first heli 12-22s in
  });

  useFrame((_, delta) => {
    const s = stateRef.current;
    const margin = Math.max(viewport.width, 20) / 2 + 10;

    if (!s.active) {
      if (elapsed.current >= s.nextSpawnAt) {
        s.active = true;
        s.x = -margin;
        s.y = 6.5 + Math.random() * 1.5; // high upper sky, slightly below planes
        s.speed = 1.4 + Math.random() * 0.6;
      }
    } else {
      s.x += delta * s.speed;
      if (s.x > margin) {
        s.active = false;
        // 1.5x more frequent: 35-75s -> 23-50s
        s.nextSpawnAt = elapsed.current + 23 + Math.random() * 27;
      }
    }

    if (rotorRef.current) {
      rotorRef.current.rotation.y += delta * 30;
    }

    if (groupRef.current) {
      groupRef.current.visible = s.active;
      groupRef.current.position.set(s.x, s.y, 1);
    }
  });

  // 2.5x scale on the helicopter group
  return (
    <group ref={groupRef} visible={false} scale={[2.5, 2.5, 2.5]}>
      <mesh>
        <boxGeometry args={[0.55, 0.3, 0.3]} />
        <meshBasicMaterial color={CHARCOAL_LIGHT} toneMapped={false} />
      </mesh>
      {/* Cockpit accent */}
      <mesh position={[-0.2, 0.02, 0.16]}>
        <boxGeometry args={[0.18, 0.14, 0.02]} />
        <meshBasicMaterial color={TERRACOTTA} toneMapped={false} />
      </mesh>
      {/* Tail boom (sticks out to the LEFT since heli flies right, tail trails behind) */}
      <mesh position={[-0.5, 0.08, 0]}>
        <boxGeometry args={[0.55, 0.06, 0.06]} />
        <meshBasicMaterial color={CHARCOAL_LIGHT} toneMapped={false} />
      </mesh>
      {/* Tail rotor */}
      <mesh position={[-0.8, 0.12, 0]}>
        <boxGeometry args={[0.04, 0.22, 0.04]} />
        <meshBasicMaterial color={TERRACOTTA} toneMapped={false} />
      </mesh>
      {/* Rotor mast */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.05, 0.08, 0.05]} />
        <meshBasicMaterial color={CHARCOAL_DARKER} toneMapped={false} />
      </mesh>
      {/* Spinning main rotor — thin slab, rotates on Y axis */}
      <mesh ref={rotorRef} position={[0, 0.27, 0]}>
        <boxGeometry args={[1.4, 0.02, 0.06]} />
        <meshBasicMaterial color={OFFWHITE} toneMapped={false} opacity={0.75} transparent />
      </mesh>
    </group>
  );
}

/**
 * Clouds — brutalist low-poly clumps of offwhite boxes drifting slowly
 * across the upper sky. Multiple cloud groups at different speeds for
 * a subtle parallax feel.
 */
type Cloud = {
  x: number;
  y: number;
  scale: number;
  speed: number;
  opacity: number;
  shape: { dx: number; dy: number; w: number; h: number }[];
};

function generateClouds(count: number, seed: number): Cloud[] {
  const rng = mulberry32(seed);
  const clouds: Cloud[] = [];
  for (let i = 0; i < count; i++) {
    // Each cloud is 3-5 overlapping slabs to suggest a chunky silhouette
    const slabs = 3 + Math.floor(rng() * 3);
    const shape: Cloud["shape"] = [];
    let cursor = 0;
    for (let s = 0; s < slabs; s++) {
      const w = 0.9 + rng() * 0.9;
      const h = 0.3 + rng() * 0.25;
      shape.push({
        dx: cursor + w / 2,
        dy: (rng() - 0.5) * 0.3,
        w,
        h,
      });
      cursor += w * (0.5 + rng() * 0.3);
    }
    clouds.push({
      x: -20 + i * 14 + rng() * 4,
      y: 9 + rng() * 4, // high in the sky
      scale: 1 + rng() * 1.4,
      speed: 0.25 + rng() * 0.35, // slow drift
      opacity: 0.32 + rng() * 0.18,
      shape,
    });
  }
  return clouds;
}

function Clouds() {
  const { viewport } = useThree();
  const clouds = useMemo(() => generateClouds(8, 7777), []);
  const positionsRef = useRef(clouds.map((c) => c.x));

  // Refs to each cloud's group so we can mutate position without re-rendering
  const groupRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame((_, delta) => {
    const margin = Math.max(viewport.width, 20) / 2 + 8;
    for (let i = 0; i < clouds.length; i++) {
      positionsRef.current[i] -= delta * clouds[i].speed;
      if (positionsRef.current[i] < -margin) {
        positionsRef.current[i] += margin * 2; // wrap back to the right
      }
      const g = groupRefs.current[i];
      if (g) g.position.x = positionsRef.current[i];
    }
  });

  return (
    <>
      {clouds.map((c, i) => (
        <group
          key={i}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
          position={[c.x, c.y, 0.5]}
          scale={[c.scale, c.scale, c.scale]}
        >
          {c.shape.map((slab, j) => (
            <mesh key={j} position={[slab.dx, slab.dy, 0]}>
              <planeGeometry args={[slab.w, slab.h]} />
              <meshBasicMaterial
                color={OFFWHITE}
                transparent
                opacity={c.opacity}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

function StaticSkyline() {
  const { viewport } = useThree();
  const elapsed = useElapsed();
  const nextToggleAt = useRef(10 + Math.random() * 10);
  const [toggledKeys, setToggledKeys] = useState<Set<string>>(new Set());

  // Buildings are 3x bigger now, so fewer needed to fill the same screen width
  const buildings = useMemo(() => {
    const count = Math.max(14, Math.ceil(viewport.width / 7.5) + 4);
    return generateBuildings(count, 2468).buildings;
  }, [viewport.width]);

  // Center the strip horizontally
  const totalWidth = useMemo(
    () => (buildings.length > 0 ? buildings[buildings.length - 1].x + buildings[buildings.length - 1].width / 2 : 0),
    [buildings],
  );

  // 3x bigger than before (was max 0.85, viewport.width / 100)
  const scale = Math.min(2.55, viewport.width / 33);

  // Toggle one random window every 10-20 seconds
  useFrame(() => {
    if (elapsed.current >= nextToggleAt.current && buildings.length > 0) {
      const bIdx = Math.floor(Math.random() * buildings.length);
      const b = buildings[bIdx];
      const col = Math.floor(Math.random() * b.windowCols);
      const row = Math.floor(Math.random() * b.windowRows);
      const key = `${bIdx}-${col}-${row}`;
      setToggledKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      nextToggleAt.current = elapsed.current + 10 + Math.random() * 10;
    }
  });

  return (
    <group
      position={[-(totalWidth * scale) / 2, -viewport.height / 2 + 0.5, 0]}
      scale={[scale, scale, scale]}
    >
      {buildings.map((b, i) => (
        <BuildingMesh key={i} building={b} index={i} toggledKeys={toggledKeys} />
      ))}
    </group>
  );
}

export function LandingSkyline() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-full h-full" aria-hidden="true" />;
  }

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <Canvas
        orthographic
        camera={{ position: [0, 2, 10], zoom: 35, near: 0.1, far: 50 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
        style={{ background: "transparent", opacity: 0.45 }}
      >
        {/* Atmospheric fog blends distant buildings into the charcoal background */}
        <fog attach="fog" args={[FOG_COLOR, 8, 28]} />

        {/* Ambient fill */}
        <ambientLight intensity={0.5} />
        {/* Key light from upper left */}
        <directionalLight position={[-10, 20, 15]} intensity={0.6} color={OFFWHITE} />
        {/* Warm terracotta rim light simulating street glow */}
        <directionalLight position={[15, 5, 10]} intensity={0.25} color={TERRACOTTA} />
        {/* Background skyscrapers — taller, dimmer, set back via z=-3 so
            three.js fog softens them; renders first so they sit behind the
            main tenements. */}
        <BackgroundSkyscrapers />
        {/* Foreground brutalist tenements — static, occasional window toggles */}
        <StaticSkyline />
        {/* Upper sky layer (behind aircraft): drifting clouds */}
        <Clouds />
        {/* Occasional air traffic: plane flies left, helicopter flies right */}
        <Plane />
        <Helicopter />
      </Canvas>
    </div>
  );
}

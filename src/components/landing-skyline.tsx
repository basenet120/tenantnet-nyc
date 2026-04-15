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

function BuildingMesh({ building, index, time }: { building: Building; index: number; time: number }) {
  const { width, height, depth, windowCols, windowRows, hasCornice } = building;

  // Stable window lit-states per building
  const windows = useMemo(() => {
    const rng = mulberry32(index * 9973 + 13);
    const arr: { col: number; row: number; litAt: number; color: string; flickerSeed: number }[] = [];
    for (let c = 0; c < windowCols; c++) {
      for (let r = 0; r < windowRows; r++) {
        const lit = rng() > 0.55;
        if (!lit) continue;
        const litAt = rng() * 2.5;
        const pick = rng();
        const color = pick < 0.7 ? AMBER : pick < 0.85 ? TERRACOTTA : OFFWHITE;
        arr.push({ col: c, row: r, litAt, color, flickerSeed: rng() * 100 });
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

      {/* Windows grid */}
      {windows.map((w, i) => {
        const xPos = -width / 2 + gapX + w.col * (windowW + gapX) + windowW / 2;
        const yPos = -height / 2 + gapY + w.row * (windowH + gapY) + windowH / 2 + 0.4;
        const turnedOn = time > w.litAt;
        const flicker = turnedOn ? 0.85 + Math.sin(time * 1.5 + w.flickerSeed) * 0.1 : 0;
        return (
          <mesh key={i} position={[xPos, yPos, depth / 2 + 0.01]}>
            <planeGeometry args={[windowW * 0.82, windowH * 0.7]} />
            <meshBasicMaterial
              color={w.color}
              transparent
              opacity={flicker}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function ScrollingSkyline() {
  const { viewport } = useThree();
  const [time, setTime] = useState(0);
  const groupRef = useRef<THREE.Group>(null);
  const scrollRef = useRef(0);

  // One strip of unique buildings, rendered twice back-to-back for seamless loop
  const { buildings, totalWidth } = useMemo(() => generateBuildings(32, 2468), []);

  useFrame((_, delta) => {
    setTime((t) => t + delta);
    // Slow continuous scroll (units per second). Negative = leftward drift.
    scrollRef.current -= delta * 0.8;
    // Loop when we've scrolled one full strip width
    if (scrollRef.current <= -totalWidth) scrollRef.current += totalWidth;
    if (groupRef.current) {
      groupRef.current.position.x = scrollRef.current;
    }
  });

  // Scale the buildings to fill vertical space in the viewport
  const scale = Math.min(1.2, viewport.height / 14);

  return (
    <group ref={groupRef} position={[0, -4, 0]} scale={[scale, scale, scale]}>
      {/* First strip */}
      {buildings.map((b, i) => (
        <BuildingMesh key={`a-${i}`} building={b} index={i} time={time} />
      ))}
      {/* Second strip, offset by totalWidth so it sits flush to the right */}
      <group position={[totalWidth, 0, 0]}>
        {buildings.map((b, i) => (
          <BuildingMesh key={`b-${i}`} building={b} index={i} time={time} />
        ))}
      </group>
      {/* Third strip for extra coverage on wide screens */}
      <group position={[totalWidth * 2, 0, 0]}>
        {buildings.map((b, i) => (
          <BuildingMesh key={`c-${i}`} building={b} index={i} time={time} />
        ))}
      </group>
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
        <ScrollingSkyline />
      </Canvas>
    </div>
  );
}

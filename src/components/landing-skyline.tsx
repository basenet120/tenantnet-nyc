"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";

/**
 * Brutalist low-poly NYC tenement skyline.
 * Orthographic camera for that flat civic-poster look.
 * Lit windows animate in over the first few seconds, then occasional flickers.
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

const CHARCOAL = "#1a1a1a";
const CHARCOAL_LIGHT = "#2a2a2a";
const CHARCOAL_DARKER = "#0e0e0e";
const TERRACOTTA = "#c45d3e";
const AMBER = "#d4a843";
const OFFWHITE = "#f5f0eb";

function generateBuildings(count: number): Building[] {
  const buildings: Building[] = [];
  let x = 0;
  const rng = mulberry32(2468); // deterministic for SSR-safe render

  for (let i = 0; i < count; i++) {
    const width = 2.2 + rng() * 1.4;
    const height = 5 + rng() * 6;
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
  return buildings;
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

  // Generate stable window lit-states per building
  const windows = useMemo(() => {
    const rng = mulberry32(index * 9973 + 13);
    const arr: { col: number; row: number; litAt: number; color: string }[] = [];
    for (let c = 0; c < windowCols; c++) {
      for (let r = 0; r < windowRows; r++) {
        const lit = rng() > 0.55;
        if (!lit) continue;
        // Stagger which ones light up in the first 3 seconds
        const litAt = rng() * 2.5;
        // Mostly amber, a few terracotta, a few offwhite
        const pick = rng();
        const color = pick < 0.7 ? AMBER : pick < 0.85 ? TERRACOTTA : OFFWHITE;
        arr.push({ col: c, row: r, litAt, color });
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
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={CHARCOAL_LIGHT} roughness={0.95} />
      </mesh>

      {/* Top cornice / cap in terracotta — the brand signature bar */}
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
        const flicker = turnedOn ? 0.9 + Math.sin(time * 2 + i) * 0.1 : 0;
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

function Skyline() {
  const { viewport } = useThree();
  const [time, setTime] = useState(0);
  useFrame((_, delta) => setTime((t) => t + delta));

  const buildings = useMemo(() => generateBuildings(14), []);
  const totalWidth = buildings[buildings.length - 1].x + buildings[buildings.length - 1].width / 2;

  // Center the skyline horizontally and scale to fit viewport width
  const scale = Math.min(1.2, (viewport.width * 0.95) / totalWidth);

  return (
    <group position={[-totalWidth / 2, -3, 0]} scale={[scale, scale, scale]}>
      {buildings.map((b, i) => (
        <BuildingMesh key={i} building={b} index={i} time={time} />
      ))}
    </group>
  );
}

export function LandingSkyline() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Skip on SSR to avoid hydration mismatch and cut initial payload
  if (!mounted) {
    return <div className="w-full h-full" aria-hidden="true" />;
  }

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <Canvas
        orthographic
        camera={{ position: [0, 2, 10], zoom: 35, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
        style={{ background: "transparent" }}
      >
        {/* Ambient fill so shadows aren't black */}
        <ambientLight intensity={0.6} />
        {/* Key light from upper left */}
        <directionalLight position={[-10, 20, 15]} intensity={0.7} color={OFFWHITE} />
        {/* Warm rim light from right simulating street glow */}
        <directionalLight position={[15, 5, 10]} intensity={0.3} color={TERRACOTTA} />
        <Skyline />
      </Canvas>
    </div>
  );
}

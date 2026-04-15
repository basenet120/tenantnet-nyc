"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";

/**
 * Brutalist low-poly NYC skyline:
 *  - foreground tenement strip (StaticSkyline)
 *  - background skyscraper row with varied architecture + materials
 *    (stone, steel, glass) including iconic Empire State + Freedom Tower
 *    silhouettes
 *  - upper sky with clouds, occasional plane (left), helicopter (right)
 * Foggy + 0.45 canvas opacity so hero text stays readable on top.
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

// Background-skyscraper material palette
const STEEL_BODY = "#3a4350";
const GLASS_DARK_BODY = "#1c2733";
const GLASS_BLUE_BODY = "#243a4f";
const SPIRE_COLOR = "#6b6b6b";
const COOL_WINDOW = "#8aa3c3";
const COOL_WINDOW_BRIGHT = "#b9cde6";
const ANTENNA_TIP = "#c44040"; // little red beacon at the tip

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

// ---------------------------------------------------------------------------
// Background skyscrapers
// ---------------------------------------------------------------------------

type SkyscraperVariant =
  | "box"
  | "stepped"
  | "tapered"
  | "crowned"
  | "empire_state"
  | "freedom_tower";

type SkyscraperMaterial = "stone" | "steel" | "glass_dark" | "glass_blue";

type SkyscraperMaterialProps = {
  body: string;
  roughness: number;
  metalness: number;
  windowColors: string[];
  windowOpacity: number;
};

const MATERIAL_PROPS: Record<SkyscraperMaterial, SkyscraperMaterialProps> = {
  stone: {
    body: CHARCOAL_DARKER,
    roughness: 0.95,
    metalness: 0.0,
    windowColors: [AMBER, AMBER, AMBER, OFFWHITE, TERRACOTTA],
    windowOpacity: 0.55,
  },
  steel: {
    body: STEEL_BODY,
    roughness: 0.55,
    metalness: 0.55,
    windowColors: [AMBER, OFFWHITE, AMBER, COOL_WINDOW, OFFWHITE],
    windowOpacity: 0.5,
  },
  glass_dark: {
    body: GLASS_DARK_BODY,
    roughness: 0.25,
    metalness: 0.7,
    windowColors: [COOL_WINDOW, COOL_WINDOW_BRIGHT, AMBER, COOL_WINDOW, OFFWHITE],
    windowOpacity: 0.4,
  },
  glass_blue: {
    body: GLASS_BLUE_BODY,
    roughness: 0.2,
    metalness: 0.65,
    windowColors: [COOL_WINDOW_BRIGHT, COOL_WINDOW, OFFWHITE, COOL_WINDOW_BRIGHT, AMBER],
    windowOpacity: 0.45,
  },
};

type Skyscraper = {
  x: number;
  width: number;
  height: number;
  variant: SkyscraperVariant;
  material: SkyscraperMaterial;
};

function pickVariant(rng: () => number): SkyscraperVariant {
  const v = rng();
  if (v < 0.25) return "box";
  if (v < 0.55) return "stepped";
  if (v < 0.75) return "tapered";
  return "crowned";
}

function pickMaterial(rng: () => number): SkyscraperMaterial {
  const m = rng();
  if (m < 0.3) return "stone";
  if (m < 0.55) return "steel";
  if (m < 0.8) return "glass_dark";
  return "glass_blue";
}

function generateSkyscrapers(count: number, seed: number): { skyscrapers: Skyscraper[]; totalWidth: number } {
  const skyscrapers: Skyscraper[] = [];
  let x = 0;
  const rng = mulberry32(seed);

  // Reserve indices for the two landmark towers — placed about 30% / 70%
  // through the row so they read as distinct icons in the skyline.
  const empireIdx = Math.max(1, Math.floor(count * 0.3));
  const freedomIdx = Math.min(count - 2, Math.floor(count * 0.7));

  for (let i = 0; i < count; i++) {
    let s: Skyscraper;
    if (i === empireIdx) {
      const width = 2.6 + rng() * 0.3;
      s = { x: x + width / 2, width, height: 28, variant: "empire_state", material: "stone" };
    } else if (i === freedomIdx) {
      const width = 2.2 + rng() * 0.3;
      s = { x: x + width / 2, width, height: 32, variant: "freedom_tower", material: "glass_blue" };
    } else {
      const width = 1.6 + rng() * 1.0;
      const height = 11 + rng() * 10;
      s = {
        x: x + width / 2,
        width,
        height,
        variant: pickVariant(rng),
        material: pickMaterial(rng),
      };
    }
    skyscrapers.push(s);
    // Tighter spacing than before so the row visually packs together
    x += s.width + 0.12 + rng() * 0.3;
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

// ---------------------------------------------------------------------------
// Skyscraper rendering — sections + variants
// ---------------------------------------------------------------------------

/**
 * One rectangular tier of a skyscraper: box body (with the given material's
 * color/roughness/metalness) + window grid in front. yBase is the y-coordinate
 * of the BOTTOM of this section relative to the parent group (which sits at
 * ground level).
 */
function SkyscraperSection({
  width,
  height,
  depth = 0.6,
  yBase,
  cols,
  rows,
  material,
  seed,
  density = 0.4,
}: {
  width: number;
  height: number;
  depth?: number;
  yBase: number;
  cols: number;
  rows: number;
  material: SkyscraperMaterial;
  seed: number;
  density?: number;
}) {
  const props = MATERIAL_PROPS[material];

  const slots = useMemo(() => {
    const rng = mulberry32(seed);
    const arr: { col: number; row: number; lit: boolean; color: string }[] = [];
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const lit = rng() > 1 - density;
        const colors = props.windowColors;
        const color = colors[Math.floor(rng() * colors.length)];
        arr.push({ col: c, row: r, lit, color });
      }
    }
    return arr;
  }, [seed, cols, rows, density, props.windowColors]);

  const windowW = (width * 0.78) / cols;
  const windowH = (height * 0.85) / rows;
  const gapX = (width - windowW * cols) / (cols + 1);
  const gapY = (height - windowH * rows) / (rows + 1);

  return (
    <group position={[0, yBase + height / 2, 0]}>
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={props.body}
          roughness={props.roughness}
          metalness={props.metalness}
        />
      </mesh>
      {slots.map((w, i) => {
        if (!w.lit) return null;
        const xPos = -width / 2 + gapX + w.col * (windowW + gapX) + windowW / 2;
        const yPos = -height / 2 + gapY + w.row * (windowH + gapY) + windowH / 2;
        return (
          <mesh key={i} position={[xPos, yPos, depth / 2 + 0.005]}>
            <planeGeometry args={[windowW * 0.7, windowH * 0.55]} />
            <meshBasicMaterial
              color={w.color}
              transparent
              opacity={props.windowOpacity}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Slim antenna mast topped with a small red beacon — the classic
 * NYC skyline silhouette accent shared by Empire State, Freedom Tower,
 * and the generic "crowned" variant.
 */
function AntennaMast({
  yBase,
  height,
  thickness,
}: {
  yBase: number;
  height: number;
  thickness: number;
}) {
  return (
    <>
      <mesh position={[0, yBase + height / 2, 0]}>
        <boxGeometry args={[thickness, height, thickness]} />
        <meshStandardMaterial color={SPIRE_COLOR} metalness={0.75} roughness={0.3} />
      </mesh>
      <mesh position={[0, yBase + height + 0.08, 0]}>
        <boxGeometry args={[thickness * 1.6, 0.18, thickness * 1.6]} />
        <meshBasicMaterial color={ANTENNA_TIP} toneMapped={false} />
      </mesh>
    </>
  );
}

function renderSkyscraperBody({
  variant,
  material,
  width,
  height,
  seed,
}: {
  variant: SkyscraperVariant;
  material: SkyscraperMaterial;
  width: number;
  height: number;
  seed: number;
}) {
  switch (variant) {
    case "box": {
      const cols = Math.max(2, Math.floor(width * 1.6));
      const rows = Math.max(8, Math.floor(height * 1.2));
      return (
        <SkyscraperSection
          width={width}
          height={height}
          yBase={0}
          cols={cols}
          rows={rows}
          material={material}
          seed={seed}
        />
      );
    }
    case "stepped": {
      const h1 = height * 0.7;
      const h2 = height * 0.3;
      const w2 = width * 0.7;
      return (
        <>
          <SkyscraperSection
            width={width}
            height={h1}
            yBase={0}
            cols={Math.max(2, Math.floor(width * 1.6))}
            rows={Math.max(6, Math.floor(h1 * 1.3))}
            material={material}
            seed={seed}
          />
          <SkyscraperSection
            width={w2}
            height={h2}
            yBase={h1}
            cols={Math.max(2, Math.floor(w2 * 1.6))}
            rows={Math.max(3, Math.floor(h2 * 1.3))}
            material={material}
            seed={seed + 17}
          />
        </>
      );
    }
    case "tapered": {
      const h1 = height * 0.5;
      const h2 = height * 0.3;
      const h3 = height * 0.2;
      const w1 = width;
      const w2 = width * 0.85;
      const w3 = width * 0.65;
      return (
        <>
          <SkyscraperSection
            width={w1}
            height={h1}
            yBase={0}
            cols={Math.max(2, Math.floor(w1 * 1.6))}
            rows={Math.max(5, Math.floor(h1 * 1.3))}
            material={material}
            seed={seed}
          />
          <SkyscraperSection
            width={w2}
            height={h2}
            yBase={h1}
            cols={Math.max(2, Math.floor(w2 * 1.6))}
            rows={Math.max(3, Math.floor(h2 * 1.3))}
            material={material}
            seed={seed + 11}
          />
          <SkyscraperSection
            width={w3}
            height={h3}
            yBase={h1 + h2}
            cols={Math.max(2, Math.floor(w3 * 1.6))}
            rows={Math.max(3, Math.floor(h3 * 1.3))}
            material={material}
            seed={seed + 23}
          />
        </>
      );
    }
    case "crowned": {
      const bodyH = height * 0.85;
      const crownH = 0.8;
      const antennaH = height * 0.18;
      return (
        <>
          <SkyscraperSection
            width={width}
            height={bodyH}
            yBase={0}
            cols={Math.max(2, Math.floor(width * 1.6))}
            rows={Math.max(8, Math.floor(bodyH * 1.3))}
            material={material}
            seed={seed}
          />
          {/* Mechanical crown */}
          <mesh position={[0, bodyH + crownH / 2, 0]}>
            <boxGeometry args={[width * 0.7, crownH, 0.5]} />
            <meshStandardMaterial color={CHARCOAL_DARKER} roughness={0.9} />
          </mesh>
          <AntennaMast
            yBase={bodyH + crownH}
            height={antennaH}
            thickness={width * 0.05}
          />
        </>
      );
    }
    case "empire_state": {
      // Iconic Art Deco silhouette: wide base → 2 setbacks → spire mass → mast
      const baseH = height * 0.46;
      const setback1H = height * 0.18;
      const setback1W = width * 0.85;
      const setback2H = height * 0.1;
      const setback2W = width * 0.7;
      const towerH = height * 0.18;
      const towerW = width * 0.42;
      const spireH = height * 0.32;
      const spireW = width * 0.05;

      let y = 0;
      const baseY = y;
      y += baseH;
      const sb1Y = y;
      y += setback1H;
      const sb2Y = y;
      y += setback2H;
      const towerY = y;
      const capY = towerY + towerH;
      const mastY = capY + 0.3;

      return (
        <>
          <SkyscraperSection
            width={width}
            height={baseH}
            yBase={baseY}
            cols={Math.max(3, Math.floor(width * 1.8))}
            rows={Math.max(8, Math.floor(baseH * 1.4))}
            material="stone"
            seed={seed}
          />
          <SkyscraperSection
            width={setback1W}
            height={setback1H}
            yBase={sb1Y}
            cols={Math.max(2, Math.floor(setback1W * 1.8))}
            rows={Math.max(4, Math.floor(setback1H * 1.4))}
            material="stone"
            seed={seed + 11}
          />
          <SkyscraperSection
            width={setback2W}
            height={setback2H}
            yBase={sb2Y}
            cols={Math.max(2, Math.floor(setback2W * 1.8))}
            rows={Math.max(3, Math.floor(setback2H * 1.4))}
            material="stone"
            seed={seed + 23}
          />
          <SkyscraperSection
            width={towerW}
            height={towerH}
            yBase={towerY}
            cols={Math.max(2, Math.floor(towerW * 1.8))}
            rows={Math.max(4, Math.floor(towerH * 1.4))}
            material="stone"
            seed={seed + 41}
          />
          {/* Decorative bronze cap above the windowed tower */}
          <mesh position={[0, capY + 0.15, 0]}>
            <boxGeometry args={[towerW * 0.78, 0.3, 0.55]} />
            <meshStandardMaterial color={TERRACOTTA} roughness={0.6} metalness={0.4} />
          </mesh>
          <AntennaMast yBase={mastY} height={spireH} thickness={spireW} />
        </>
      );
    }
    case "freedom_tower": {
      // Tapered glass tower: 3 stacked tiers narrowing toward the top,
      // then a steel parapet, then a very tall slim spire.
      const tier1H = height * 0.32;
      const tier2H = height * 0.22;
      const tier3H = height * 0.16;
      const w1 = width;
      const w2 = width * 0.86;
      const w3 = width * 0.68;
      const crownH = 0.9;
      const crownW = w3 * 0.85;
      const spireH = height * 0.3;
      const spireW = width * 0.04;

      let y = 0;
      const t1Y = y;
      y += tier1H;
      const t2Y = y;
      y += tier2H;
      const t3Y = y;
      y += tier3H;
      const crownY = y;
      const mastY = crownY + crownH;

      return (
        <>
          <SkyscraperSection
            width={w1}
            height={tier1H}
            yBase={t1Y}
            cols={Math.max(3, Math.floor(w1 * 1.8))}
            rows={Math.max(6, Math.floor(tier1H * 1.5))}
            material="glass_blue"
            seed={seed}
            density={0.55}
          />
          <SkyscraperSection
            width={w2}
            height={tier2H}
            yBase={t2Y}
            cols={Math.max(3, Math.floor(w2 * 1.8))}
            rows={Math.max(5, Math.floor(tier2H * 1.5))}
            material="glass_blue"
            seed={seed + 13}
            density={0.55}
          />
          <SkyscraperSection
            width={w3}
            height={tier3H}
            yBase={t3Y}
            cols={Math.max(3, Math.floor(w3 * 1.8))}
            rows={Math.max(4, Math.floor(tier3H * 1.5))}
            material="glass_blue"
            seed={seed + 31}
            density={0.55}
          />
          {/* Steel parapet crown */}
          <mesh position={[0, crownY + crownH / 2, 0]}>
            <boxGeometry args={[crownW, crownH, 0.5]} />
            <meshStandardMaterial color={STEEL_BODY} metalness={0.7} roughness={0.3} />
          </mesh>
          <AntennaMast yBase={mastY} height={spireH} thickness={spireW} />
        </>
      );
    }
  }
}

function SkyscraperMesh({ tower, index }: { tower: Skyscraper; index: number }) {
  const seed = index * 7919 + 31;
  return (
    <group position={[tower.x, 0, 0]}>
      {renderSkyscraperBody({
        variant: tower.variant,
        material: tower.material,
        width: tower.width,
        height: tower.height,
        seed,
      })}
    </group>
  );
}

/**
 * Background row of skyscrapers — taller, varied, set back via z=-3 so the
 * scene's atmospheric fog dims them. Count + scale derive from viewport so
 * the row spans the full screen width at every breakpoint.
 */
function BackgroundSkyscrapers() {
  const { viewport } = useThree();

  const { skyscrapers, totalWidth, scale } = useMemo(() => {
    // Scale grows with viewport but is clamped — keeps towers readable
    // on phones while letting them get a bit larger on wide screens.
    const targetScale = Math.min(2.2, Math.max(1.4, viewport.width / 28));
    // Each tower averages ~2.4 raw units (width + spacing). Aim to overshoot
    // the viewport by ~25% so the row clearly fills the screen.
    const targetVisible = viewport.width * 1.25;
    const count = Math.max(10, Math.ceil(targetVisible / (targetScale * 2.4)));
    const gen = generateSkyscrapers(count, 9241);
    return {
      skyscrapers: gen.skyscrapers,
      totalWidth: gen.totalWidth,
      scale: targetScale,
    };
  }, [viewport.width]);

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

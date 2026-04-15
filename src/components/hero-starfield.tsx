"use client";

import { useEffect, useMemo, useState } from "react";

type Star = {
  x: number;
  y: number;
  size: number;
  twinkle: boolean;
  delay: number;
  duration: number;
  baseOpacity: number;
};

type Shooter = {
  key: number;
  x: number;
  y: number;
  /** Angle (deg) of the motion vector — the rectangle's +X axis aligns with it
   *  so the head points in the direction of travel and the tail trails
   *  exactly opposite, regardless of whether dx is positive or negative. */
  angle: number;
  dx: number;
  dy: number;
  duration: number;
};

const STATIC_COUNT = 55;
const TWINKLE_COUNT = 20;
const SKY_HEIGHT_PCT = 58;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function HeroStarfield() {
  const stars = useMemo<Star[]>(() => {
    const rng = mulberry32(19873);
    const arr: Star[] = [];
    for (let i = 0; i < STATIC_COUNT + TWINKLE_COUNT; i++) {
      arr.push({
        x: rng() * 100,
        y: rng() * SKY_HEIGHT_PCT,
        size: 0.6 + rng() * 1.8,
        twinkle: i < TWINKLE_COUNT,
        delay: rng() * 4,
        duration: 2.2 + rng() * 3.5,
        baseOpacity: 0.55 + rng() * 0.35,
      });
    }
    return arr;
  }, []);

  const [shooter, setShooter] = useState<Shooter | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const spawn = () => {
      const duration = 1100 + Math.random() * 700;
      const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      // Start from the side the shooter is flying FROM so the flight path
      // spans a meaningful portion of the hero. Leftward shooters start
      // on the right, rightward shooters start on the left.
      const x = dir === 1 ? Math.random() * 55 : 45 + Math.random() * 55;
      const distance = 520 + Math.random() * 260;
      // Random tilt magnitude — applied downward in both directions.
      const tilt = 18 + Math.random() * 14;
      const dx = distance * dir;
      const dy = distance * Math.tan((tilt * Math.PI) / 180);
      // Motion vector angle. atan2 returns radians; convert to deg.
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      setShooter({
        key: Date.now(),
        x,
        y: Math.random() * 35,
        angle,
        dx,
        dy,
        duration,
      });
      timeout = setTimeout(schedule, duration + 200);
    };

    const schedule = () => {
      const wait = 7000 + Math.random() * 11000;
      timeout = setTimeout(spawn, wait);
    };

    schedule();
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s, i) => (
        <span
          key={i}
          className={s.twinkle ? "hero-star hero-star-twinkle" : "hero-star"}
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.twinkle ? undefined : s.baseOpacity,
            animationDelay: s.twinkle ? `${s.delay}s` : undefined,
            animationDuration: s.twinkle ? `${s.duration}s` : undefined,
          }}
        />
      ))}
      {shooter && (
        <span
          key={shooter.key}
          className="hero-shooter"
          style={{
            left: `${shooter.x}%`,
            top: `${shooter.y}%`,
            // Rotate to the motion vector — the rectangle's +X (head end)
            // aligns with the direction of travel, so the fading tail
            // always points exactly opposite the motion, regardless of
            // whether the shooter is flying left or right.
            transform: `rotate(${shooter.angle}deg)`,
            // custom properties drive the keyframe translate
            ["--shoot-dx" as string]: `${shooter.dx}px`,
            ["--shoot-dy" as string]: `${shooter.dy}px`,
            animationDuration: `${shooter.duration}ms`,
          }}
        />
      )}

      <style>{`
        .hero-star {
          position: absolute;
          background: #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 4px rgba(255, 255, 255, 0.45);
          pointer-events: none;
        }
        .hero-star-twinkle {
          animation: heroStarTwinkle ease-in-out infinite;
        }
        @keyframes heroStarTwinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.85); }
          50%      { opacity: 1;   transform: scale(1.15); }
        }

        .hero-shooter {
          position: absolute;
          width: 120px;
          height: 1.5px;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.85) 55%,
            #ffffff 95%,
            rgba(255, 255, 255, 0) 100%
          );
          border-radius: 1px;
          filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.85));
          transform-origin: 100% 50%;
          opacity: 0;
          animation-name: heroShooterFly;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
        @keyframes heroShooterFly {
          0%   { opacity: 0; translate: 0 0; }
          12%  { opacity: 1; }
          100% { opacity: 0; translate: var(--shoot-dx) var(--shoot-dy); }
        }
      `}</style>
    </div>
  );
}

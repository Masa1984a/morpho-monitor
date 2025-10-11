'use client';

import { useEffect, useRef } from 'react';
import type { WebGLFluidOptions } from 'webgl-fluid';

const fluidSettings: WebGLFluidOptions = {
  IMMEDIATE: true,
  TRIGGER: 'hover',
  AUTO: true,
  INTERVAL: 3800,
  SIM_RESOLUTION: 256,
  DYE_RESOLUTION: 1024,
  DENSITY_DISSIPATION: 0.92,
  VELOCITY_DISSIPATION: 0.28,
  CURL: 38,
  PRESSURE: 0.9,
  PRESSURE_ITERATIONS: 24,
  SPLAT_RADIUS: 0.35,
  SPLAT_FORCE: 6000,
  SPLAT_COUNT: 18,
  COLORFUL: true,
  COLOR_UPDATE_SPEED: 12,
  BLOOM: true,
  BLOOM_INTENSITY: 1.2,
  BLOOM_THRESHOLD: 0.55,
  BLOOM_SOFT_KNEE: 0.8,
  SUNRAYS: true,
  SUNRAYS_WEIGHT: 1.0,
  TRANSPARENT: true,
  BACK_COLOR: { r: 4, g: 6, b: 12 }
};

interface FluidSimulationBackgroundProps {
  className?: string;
}

export function FluidSimulationBackground({ className }: FluidSimulationBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    const initialize = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const { default: WebGLFluid } = await import('webgl-fluid');
      if (cancelled || !canvasRef.current) return;

      WebGLFluid(canvas, fluidSettings);
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full ${className ?? ''}`}
    />
  );
}

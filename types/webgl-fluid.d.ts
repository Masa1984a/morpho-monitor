declare module 'webgl-fluid' {
  export type WebGLFluidTrigger = 'hover' | 'click' | 'manual' | 'auto';

  export interface WebGLFluidOptions {
    TRIGGER?: WebGLFluidTrigger;
    IMMEDIATE?: boolean;
    AUTO?: boolean;
    INTERVAL?: number;
    SIM_RESOLUTION?: number;
    DYE_RESOLUTION?: number;
    CAPTURE_RESOLUTION?: number;
    DENSITY_DISSIPATION?: number;
    VELOCITY_DISSIPATION?: number;
    PRESSURE?: number;
    PRESSURE_ITERATIONS?: number;
    CURL?: number;
    SPLAT_RADIUS?: number;
    SPLAT_FORCE?: number;
    SPLAT_COUNT?: number;
    SHADING?: boolean;
    COLORFUL?: boolean;
    COLOR_UPDATE_SPEED?: number;
    PAUSED?: boolean;
    BACK_COLOR?: { r: number; g: number; b: number; a?: number };
    TRANSPARENT?: boolean;
    BLOOM?: boolean;
    BLOOM_ITERATIONS?: number;
    BLOOM_RESOLUTION?: number;
    BLOOM_INTENSITY?: number;
    BLOOM_THRESHOLD?: number;
    BLOOM_SOFT_KNEE?: number;
    SUNRAYS?: boolean;
    SUNRAYS_RESOLUTION?: number;
    SUNRAYS_WEIGHT?: number;
  }

  type WebGLFluidInit = (canvas: HTMLCanvasElement, options?: WebGLFluidOptions) => void;

  const WebGLFluid: WebGLFluidInit;

  export default WebGLFluid;
}

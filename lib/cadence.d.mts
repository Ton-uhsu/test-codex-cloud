export interface Cadence { target: number; phase: string; count: number; elapsed: number; last: number | null; }
export const movementCues: Record<string, string[]>;
export function createCadence(target: number): Cadence;
export function stepCadence(s: Cadence, action: string, now?: number): Cadence;

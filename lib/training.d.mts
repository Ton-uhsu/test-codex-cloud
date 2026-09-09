import type { Guide, Workout, Session } from '../src/types';
export interface SetResult { weight: number; reps: number; }
export interface SetDraft { weight: string; reps: string; }
export interface SetLog extends SetResult { key: string; sessionId: string; exerciseId: string; set: number; at: number; }
export interface Training { version: number; session: Session | null; logs: SetLog[]; drafts: Record<string, SetDraft>; }
export const TRAINING_KEY: string;
export function emptyTraining(): Training;
export function validResult(result: unknown): boolean;
export function setKey(s: Session): string;
export function startTraining(state: Training, workout: Workout, id: string, now?: number): Training;
export function recordSet(state: Training, workout: Workout, result: SetResult, expectedKey: string, now?: number): Training;
export function lastResult(logs: SetLog[], exerciseId: string): SetLog | undefined;
export function readTraining(storage: Storage | null, guide: Guide): Training;
export function writeTraining(storage: Storage | null, state: Training): boolean;

import type { Session, Workout } from "../src/types";
export function createSession(workout: Workout): Session;
export function remainingRest(session: Session, now?: number): number;
export function advanceSession(
  session: Session,
  workout: Workout,
  action: string,
  now?: number,
): Session;

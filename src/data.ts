import raw from "../data/guide.json";
import { validateGuide } from "../lib/guide.mjs";
import type { Guide, Session, Workout } from "./types";
export const guide = validateGuide(raw);
export function sessionWorkout(data: Guide, session: Session): Workout {
  const w = data.program.workouts[session.key];
  return {
    ...w,
    key: session.key,
    exercises: w.exercises.map((id) =>
      data.exercises.find((e) => e.id === id)!,
    ),
  };
}
export const mediaBase = `${import.meta.env?.BASE_URL ?? "/test-codex-cloud/"}assets/exercises/`;

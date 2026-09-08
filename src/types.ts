export type Route =
  "home" | "plan" | "setup" | "nutrition" | "today" | "library" | "guide";
export type Muscle = "chest" | "back" | "shoulders" | "legs";
export type Goal = "lose" | "maintain" | "gain";
export type Activity = "sedentary" | "light" | "moderate" | "active";
export interface Profile {
  goal: Goal;
  weight: number;
  height: number;
  age: number;
  sex: "male" | "female";
  activity: Activity;
  needsAdvice: boolean;
  startDay: number;
}
export interface Source {
  name: string;
  url: string;
  description?: string;
}
export interface Exercise {
  id: string;
  name: string;
  englishName: string;
  muscle: Muscle;
  equipment: string;
  equipmentTypes: string[];
  target: string;
  caution: string;
  steps: string[];
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  learningNote?: string;
  techniqueSource: string;
  doseSource: string;
  video: {
    youtubeId: string;
    title: string;
    channel: string;
    sourceUrl: string;
    language: string;
    checkedAt: string;
  };
}
export interface Workout {
  key: string;
  name: string;
  description: string;
  exercises: Exercise[];
}
export interface Guide {
  schemaVersion: number;
  reviewedAt: string;
  sources: Record<string, Source>;
  exercises: Exercise[];
  program: {
    name: string;
    audience: string;
    provenance: string;
    doseNote: string;
    restNote: string;
    equipmentNote: string;
    sources: string[];
    weekly: (string | null)[];
    workouts: Record<
      string,
      { name: string; description: string; exercises: string[] }
    >;
  };
}
export interface Session {
  key: string;
  index: number;
  set: number;
  phase: "warmup" | "exercise" | "rest" | "done";
  completedSets: number;
  skipped: string[];
  restUntil: number | null;
}
export interface Nutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
export type Nutrition =
  | ({
      status: "ready";
      resting: number;
      maintenance: number;
      activityFactor: number;
      goalFactor: number;
    } & Nutrients)
  | { status: "invalid"; errors: Record<string, string> }
  | { status: "unsupported"; message: string };
export type ReadyNutrition = Extract<Nutrition, { status: "ready" }>;
export interface Meal extends Nutrients {
  name: string;
  title: string;
  items: { id: string; grams: number; name: string; portion: string }[];
}

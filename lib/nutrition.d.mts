import type {
  Profile,
  Goal,
  Activity,
  Nutrition,
  Guide,
  Source,
} from "../src/types";
export const GOALS: Readonly<
  Record<Goal, { name: string; hint: string; factor: number }>
>;
export const ACTIVITIES: Readonly<
  Record<Activity, { name: string; factor: number }>
>;
export const NUTRITION_SOURCES: Readonly<Record<string, Source>>;
export const NUTRITION_REVIEWED_AT: string;
export const PROFILE_KEY: string;
export function validateProfile(input: unknown): Record<string, string>;
export function calculateNutrition(profile: Profile): Nutrition;
export function readProfile(storage: Storage | null): Profile | null;
export function writeProfile(
  storage: Storage | null,
  profile: Profile | null,
  remember: boolean,
): boolean;
export function personalizedData(data: Guide, profile: Profile | null): Guide;

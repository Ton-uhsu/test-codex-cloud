import type { ReadyNutrition, Meal, Nutrients } from "../src/types";
export function buildMeals(target: ReadyNutrition): {
  meals: Meal[];
  totals: Nutrients;
};

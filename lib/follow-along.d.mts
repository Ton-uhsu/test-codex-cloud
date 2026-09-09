import type { Exercise } from "../src/types";
export function openFollow(
  exercise: Exercise,
  options?: {
    onComplete?: (() => void) | null;
    onClose?: () => void;
    assetBase?: string;
  },
): () => void;

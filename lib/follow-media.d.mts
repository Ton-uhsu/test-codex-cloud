export interface FollowMedia { id: string; seconds: number; cues: { at: number; text: string }[]; author: string; source: string; license: string; licenseUrl: string; changes: string; disclaimer?: string; }
export const followMedia: FollowMedia[];
export function getFollowMedia(id: string): FollowMedia | undefined;
export function hasFollowMedia(id: string): boolean;

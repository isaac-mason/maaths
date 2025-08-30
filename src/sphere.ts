import type { Sphere } from "./types";

/**
 * Creates a new sphere with a default center 0,0,0 and radius 1
 * @returns A new sphere.
 */
export function create(): Sphere {
  return [[0, 0, 0], 1];
}

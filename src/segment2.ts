import type { Segment2, Vec2 } from './types';

/**
 * Creates a new Segment2 initialized to [0,0],[0,0]
 */
export function create(): Segment2 {
    return [
        [0, 0],
        [0, 0],
    ];
}

/**
 * Calculates the closest point on a line segment to a given point
 * @param out Output parameter for the closest point
 * @param point The point
 * @param p First endpoint of the segment
 * @param q Second endpoint of the segment
 */
export function closestPoint(out: Vec2, point: Vec2, p: Vec2, q: Vec2): Vec2 {
    const pqx = q[0] - p[0];
    const pqz = q[1] - p[1];
    const dx = point[0] - p[0];
    const dz = point[1] - p[1];

    const d = pqx * pqx + pqz * pqz;
    let t = pqx * dx + pqz * dz;
    if (d > 0) t /= d;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;

    out[0] = p[0] + t * pqx;
    out[1] = p[1] + t * pqz;

    return out;
}

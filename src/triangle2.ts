import { EPSILON } from './common';
import type { Circle, Triangle2 } from './types';
import * as vec2 from './vec2';

export function create(): Triangle2 {
    return [
        [0, 0],
        [0, 0],
        [0, 0],
    ];
}

const _circumcircleV1 = vec2.create();
const _circumcircleV2 = vec2.create();
const _circumcircleV3 = vec2.create();

/**
 * Calculates the circumcircle of three points and stores the center in the output parameter.
 * @param p1 First point
 * @param p2 Second point
 * @param p3 Third point
 * @param c Output parameter for the circumcircle center
 * @returns The radius of the circumcircle, or 0 if the points are collinear
 */
export const circumcircle = (outCircle: Circle, triangle: Triangle2): Circle => {
    const [p1, p2, p3] = triangle;

    // calculate the circle relative to p1, to avoid some precision issues.
    const v1 = _circumcircleV1;
    const v2 = _circumcircleV2;
    const v3 = _circumcircleV3;

    // v1 is the origin (p1 - p1 = 0), v2 and v3 are relative to p1
    vec2.set(v1, 0, 0);
    vec2.subtract(v2, p2, p1);
    vec2.subtract(v3, p3, p1);

    // calculate cross product for 2D vectors (v2 - v1) × (v3 - v1)
    vec2.subtract(v2, v2, v1); // v2 - v1
    vec2.subtract(v3, v3, v1); // v3 - v1
    const cp = v2[0] * v3[1] - v2[1] * v3[0];

    if (Math.abs(cp) > EPSILON) {
        const v1Sq = vec2.dot(_circumcircleV1, _circumcircleV1);
        const v2Sq = vec2.dot(_circumcircleV2, _circumcircleV2);
        const v3Sq = vec2.dot(_circumcircleV3, _circumcircleV3);
        outCircle.center[0] = (v1Sq * (v2[1] - v3[1]) + v2Sq * (v3[1] - v1[1]) + v3Sq * (v1[1] - v2[1])) / (2 * cp);
        outCircle.center[1] = (v1Sq * (v3[0] - v2[0]) + v2Sq * (v1[0] - v3[0]) + v3Sq * (v2[0] - v1[0])) / (2 * cp);

        const r = vec2.distance(outCircle.center, v1);

        vec2.add(outCircle.center, outCircle.center, p1);

        outCircle.radius = r;

        return outCircle;
    }

    vec2.copy(outCircle.center, p1);

    outCircle.radius = 0;

    return outCircle;
};

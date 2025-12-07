import type { Box3, Ray3, Vec3 } from './types';
import * as vec3 from './vec3';




const _rayIntersectsTriangle_edge1 = vec3.create();
const _rayIntersectsTriangle_edge2 = vec3.create();
const _rayIntersectsTriangle_h = vec3.create();
const _rayIntersectsTriangle_s = vec3.create();
const _rayIntersectsTriangle_q = vec3.create();

/**
 * Ray-triangle intersection using Möller-Trumbore algorithm.
 * https://en.wikipedia.org/wiki/Möller–Trumbore_intersection_algorithm
 *
 * @param out Output object to store result (fraction and hit boolean)
 * @param ray Ray to test (with origin, direction, and length)
 * @param a First vertex of triangle
 * @param b Second vertex of triangle
 * @param c Third vertex of triangle
 */
export function intersectsTriangle(
    out: { fraction: number; hit: boolean },
    ray: Ray3,
    a: Vec3,
    b: Vec3,
    c: Vec3,
): void {
    const EPSILON = 1e-8;

    // Edge vectors
    vec3.subtract(_rayIntersectsTriangle_edge1, b, a);
    vec3.subtract(_rayIntersectsTriangle_edge2, c, a);

    // Ray-edge cross product
    vec3.cross(_rayIntersectsTriangle_h, ray.direction, _rayIntersectsTriangle_edge2);
    const det = vec3.dot(_rayIntersectsTriangle_edge1, _rayIntersectsTriangle_h);

    // Check if ray is parallel to triangle
    if (det > -EPSILON && det < EPSILON) {
        out.hit = false;
        out.fraction = 0;
        return;
    }

    const invDet = 1.0 / det;

    // Vector from triangle vertex A to ray origin
    vec3.subtract(_rayIntersectsTriangle_s, ray.origin, a);
    const u = invDet * vec3.dot(_rayIntersectsTriangle_s, _rayIntersectsTriangle_h);

    // Check if intersection is outside triangle (barycentric u coordinate)
    if (u < -EPSILON || u > 1.0 + EPSILON) {
        out.hit = false;
        out.fraction = 0;
        return;
    }

    // Second barycentric coordinate
    vec3.cross(_rayIntersectsTriangle_q, _rayIntersectsTriangle_s, _rayIntersectsTriangle_edge1);
    const v = invDet * vec3.dot(ray.direction, _rayIntersectsTriangle_q);

    // Check if intersection is outside triangle (barycentric v coordinate)
    if (v < -EPSILON || u + v > 1.0 + EPSILON) {
        out.hit = false;
        out.fraction = 0;
        return;
    }

    // Distance along ray
    const t = invDet * vec3.dot(_rayIntersectsTriangle_edge2, _rayIntersectsTriangle_q);

    // Check if intersection is within ray segment
    if (t > EPSILON && t <= ray.length + EPSILON) {
        out.hit = true;
        out.fraction = t / ray.length;
    } else {
        out.hit = false;
        out.fraction = 0;
    }
}

/**
 * Test if a ray intersects an axis-aligned bounding box.
 * Uses slab-based algorithm that handles parallel rays correctly.
 *
 * @param ray Ray to test (with origin, direction, and length)
 * @param aabb AABB to test against
 * @returns true if ray intersects the AABB, false otherwise
 */
export function intersectsBox3(ray: Ray3, aabb: Box3): boolean {
    let tmin = 0;
    let tmax = ray.length;

    for (let i = 0; i < 3; i++) {
        const d = ray.direction[i];

        if (Math.abs(d) < 1e-10) {
            // ray is parallel to slab: check if origin is within slab
            if (ray.origin[i] < aabb[0][i] || ray.origin[i] > aabb[1][i]) {
                return false;
            }
        } else {
            // compute intersection times with slab
            const invD = 1 / d;
            let t0 = (aabb[0][i] - ray.origin[i]) * invD;
            let t1 = (aabb[1][i] - ray.origin[i]) * invD;

            if (invD < 0) {
                [t0, t1] = [t1, t0];
            }

            tmin = Math.max(tmin, t0);
            tmax = Math.min(tmax, t1);

            if (tmax < tmin) {
                return false;
            }
        }
    }

    return true;
}
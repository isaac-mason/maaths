import type { Box3, Plane3, Sphere, Triangle3, Vec3 } from './types';
import * as vec3 from './vec3';

/**
 * Create a new empty Box3 with "min" set to positive infinity and "max" set to negative infinity
 * @returns A new Box3
 */
export function create(): Box3 {
    return [
        [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
        [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
    ];
}

/**
 * Clones a Box3
 * @param box - A Box3 to clone
 * @returns a clone of box
 */
export function clone(box: Box3): Box3 {
    return [
        [box[0][0], box[0][1], box[0][2]],
        [box[1][0], box[1][1], box[1][2]],
    ];
}

/**
 * Sets the min and max values of a Box3
 * @param out - The output Box3
 * @param min - The minimum corner
 * @param max - The maximum corner
 * @returns The updated Box3
 */
export function set(out: Box3, min: Vec3, max: Vec3): Box3 {
    out[0][0] = min[0];
    out[0][1] = min[1];
    out[0][2] = min[2];
    out[1][0] = max[0];
    out[1][1] = max[1];
    out[1][2] = max[2];
    return out;
}

const _setFromCenterAndSize_halfSize = vec3.create();

/**
 * Sets the box from a center point and size
 * @param out - The output Box3
 * @param center - The center point
 * @param size - The size of the box
 * @returns The updated Box3
 */
export function setFromCenterAndSize(out: Box3, center: Vec3, size: Vec3): Box3 {
    const halfSize = vec3.scale(_setFromCenterAndSize_halfSize, size, 0.5);
    vec3.sub(out[0], center, halfSize);
    vec3.add(out[1], center, halfSize);
    return out;
}

/**
 * Expands a Box3 to include a point
 * @param out - The output Box3
 * @param box - The input Box3
 * @param point - The point to include
 * @returns The expanded Box3
 */
export function expandByPoint(out: Box3, box: Box3, point: Vec3): Box3 {
    out[0][0] = Math.min(box[0][0], point[0]);
    out[0][1] = Math.min(box[0][1], point[1]);
    out[0][2] = Math.min(box[0][2], point[2]);
    out[1][0] = Math.max(box[1][0], point[0]);
    out[1][1] = Math.max(box[1][1], point[1]);
    out[1][2] = Math.max(box[1][2], point[2]);
    return out;
}

/**
 * Test if a point is contained within the bounding box
 * @param box - The bounding box
 * @param point - The point to test
 * @returns true if the point is inside or on the boundary of the box
 */
export function containsPoint(box: Box3, point: Vec3): boolean {
    const min = box[0];
    const max = box[1];
    return point[0] >= min[0] && point[0] <= max[0] &&
           point[1] >= min[1] && point[1] <= max[1] &&
           point[2] >= min[2] && point[2] <= max[2];
}

/**
 * Test if one Box3 completely contains another Box3
 * @param container - The potentially containing Box3
 * @param contained - The Box3 that might be contained
 * @returns true if the container Box3 completely contains the contained Box3
 */
export function containsBox3(container: Box3, contained: Box3): boolean {
    const containerMin = container[0];
    const containerMax = container[1];
    const containedMin = contained[0];
    const containedMax = contained[1];
    
    return containedMin[0] >= containerMin[0] && containedMax[0] <= containerMax[0] &&
           containedMin[1] >= containerMin[1] && containedMax[1] <= containerMax[1] &&
           containedMin[2] >= containerMin[2] && containedMax[2] <= containerMax[2];
}

/**
 * Check whether two bounding boxes intersect
 */
export function intersectsBox3(boxA: Box3, boxB: Box3): boolean {
    const [minA, maxA] = boxA;
    const [minB, maxB] = boxB;

    return (
        minA[0] <= maxB[0] &&
        maxA[0] >= minB[0] &&
        minA[1] <= maxB[1] &&
        maxA[1] >= minB[1] &&
        minA[2] <= maxB[2] &&
        maxA[2] >= minB[2]
    );
}

const _center: Vec3 = [0, 0, 0];
const _extents: Vec3 = [0, 0, 0];
const _v0: Vec3 = [0, 0, 0];
const _v1: Vec3 = [0, 0, 0];
const _v2: Vec3 = [0, 0, 0];
const _f0: Vec3 = [0, 0, 0];
const _f1: Vec3 = [0, 0, 0];
const _f2: Vec3 = [0, 0, 0];
const _triangleNormal: Vec3 = [0, 0, 0];
const _closestPoint: Vec3 = [0, 0, 0];

const _axesCross: number[] = new Array(27); // 9 axes * 3 components
const _axesBoxFaces: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const _axisTriangle: number[] = [0, 0, 0];

function _satForAxes(axes: number[], axisCount: number): boolean {
    for (let i = 0; i < axisCount; i++) {
        const ax = axes[i * 3 + 0];
        const ay = axes[i * 3 + 1];
        const az = axes[i * 3 + 2];
        // Skip degenerate axis (may occur if triangle edges parallel to axes)
        if (ax === 0 && ay === 0 && az === 0) continue;

        // Project triangle vertices
        const p0 = _v0[0] * ax + _v0[1] * ay + _v0[2] * az;
        const p1 = _v1[0] * ax + _v1[1] * ay + _v1[2] * az;
        const p2 = _v2[0] * ax + _v2[1] * ay + _v2[2] * az;
        let minP = p0;
        let maxP = p0;
        if (p1 < minP) minP = p1;
        else if (p1 > maxP) maxP = p1;
        if (p2 < minP) minP = p2;
        else if (p2 > maxP) maxP = p2;

        // Project AABB (centered at origin) radius onto axis
        const r = _extents[0] * Math.abs(ax) + _extents[1] * Math.abs(ay) + _extents[2] * Math.abs(az);
        if (maxP < -r || minP > r) return false; // Separating axis found
    }
    return true;
}

export function intersectsTriangle3(box: Box3, triangle: Triangle3): boolean {
    const min = box[0];
    const max = box[1];

    // Empty box quick reject
    if (min[0] > max[0] || min[1] > max[1] || min[2] > max[2]) return false;

    // Center ( (min+max) * 0.5 ) and half-extents ( max - center )
    _center[0] = (min[0] + max[0]) * 0.5;
    _center[1] = (min[1] + max[1]) * 0.5;
    _center[2] = (min[2] + max[2]) * 0.5;
    _extents[0] = max[0] - _center[0];
    _extents[1] = max[1] - _center[1];
    _extents[2] = max[2] - _center[2];

    // Translate triangle vertices so box center = origin
    _v0[0] = triangle[0][0] - _center[0];
    _v0[1] = triangle[0][1] - _center[1];
    _v0[2] = triangle[0][2] - _center[2];
    _v1[0] = triangle[1][0] - _center[0];
    _v1[1] = triangle[1][1] - _center[1];
    _v1[2] = triangle[1][2] - _center[2];
    _v2[0] = triangle[2][0] - _center[0];
    _v2[1] = triangle[2][1] - _center[1];
    _v2[2] = triangle[2][2] - _center[2];

    // Edge vectors f0 = v1 - v0, etc.
    _f0[0] = _v1[0] - _v0[0];
    _f0[1] = _v1[1] - _v0[1];
    _f0[2] = _v1[2] - _v0[2];
    _f1[0] = _v2[0] - _v1[0];
    _f1[1] = _v2[1] - _v1[1];
    _f1[2] = _v2[2] - _v1[2];
    _f2[0] = _v0[0] - _v2[0];
    _f2[1] = _v0[1] - _v2[1];
    _f2[2] = _v0[2] - _v2[2];

    // 9 cross-product axes between AABB axes (x,y,z) and triangle edges
    // First trio (x cross f) => components (0,-fz,fy)
    _axesCross[0] = 0;
    _axesCross[1] = -_f0[2];
    _axesCross[2] = _f0[1];
    _axesCross[3] = 0;
    _axesCross[4] = -_f1[2];
    _axesCross[5] = _f1[1];
    _axesCross[6] = 0;
    _axesCross[7] = -_f2[2];
    _axesCross[8] = _f2[1];
    // Second trio (y cross f) => (fz,0,-fx)
    _axesCross[9] = _f0[2];
    _axesCross[10] = 0;
    _axesCross[11] = -_f0[0];
    _axesCross[12] = _f1[2];
    _axesCross[13] = 0;
    _axesCross[14] = -_f1[0];
    _axesCross[15] = _f2[2];
    _axesCross[16] = 0;
    _axesCross[17] = -_f2[0];
    // Third trio (z cross f) => (-fy,fx,0)
    _axesCross[18] = -_f0[1];
    _axesCross[19] = _f0[0];
    _axesCross[20] = 0;
    _axesCross[21] = -_f1[1];
    _axesCross[22] = _f1[0];
    _axesCross[23] = 0;
    _axesCross[24] = -_f2[1];
    _axesCross[25] = _f2[0];
    _axesCross[26] = 0;

    if (!_satForAxes(_axesCross, 9)) return false;

    // AABB face normals
    if (!_satForAxes(_axesBoxFaces, 3)) return false;

    // Triangle face normal
    vec3.cross(_triangleNormal, _f0, _f1);
    _axisTriangle[0] = _triangleNormal[0];
    _axisTriangle[1] = _triangleNormal[1];
    _axisTriangle[2] = _triangleNormal[2];
    return _satForAxes(_axisTriangle, 1);
}

/**
 * Test intersection between axis-aligned bounding box and a sphere.
 */
export function intersectsSphere(box: Box3, sphere: Sphere): boolean {
    const min = box[0];
    const max = box[1];
    const center = sphere[0];
    const radius = sphere[1];
    // Clamp center to box to obtain closest point
    _closestPoint[0] = center[0] < min[0] ? min[0] : center[0] > max[0] ? max[0] : center[0];
    _closestPoint[1] = center[1] < min[1] ? min[1] : center[1] > max[1] ? max[1] : center[1];
    _closestPoint[2] = center[2] < min[2] ? min[2] : center[2] > max[2] ? max[2] : center[2];
    const dx = _closestPoint[0] - center[0];
    const dy = _closestPoint[1] - center[1];
    const dz = _closestPoint[2] - center[2];
    return dx * dx + dy * dy + dz * dz <= radius * radius;
}

/**
 * Test intersection between axis-aligned bounding box and plane.
 */
export function intersectsPlane3(box: Box3, plane: Plane3): boolean {
    const min = box[0];
    const max = box[1];
    const normal = plane[0];
    const constant = plane[1];

    // Select extreme points along plane normal
    let minDot = 0;
    let maxDot = 0;

    if (normal[0] > 0) {
        minDot = normal[0] * min[0];
        maxDot = normal[0] * max[0];
    } else {
        minDot = normal[0] * max[0];
        maxDot = normal[0] * min[0];
    }
    if (normal[1] > 0) {
        minDot += normal[1] * min[1];
        maxDot += normal[1] * max[1];
    } else {
        minDot += normal[1] * max[1];
        maxDot += normal[1] * min[1];
    }
    if (normal[2] > 0) {
        minDot += normal[2] * min[2];
        maxDot += normal[2] * max[2];
    } else {
        minDot += normal[2] * max[2];
        maxDot += normal[2] * min[2];
    }

    // Plane intersection occurs if the interval [minDot + constant, maxDot + constant] straddles zero
    return minDot + constant <= 0 && maxDot + constant >= 0;
}

/**
 * Test intersection between axis-aligned bounding box and a ray.
 * Ray is defined by start and end points.
 * Uses slab method for intersection testing.
 *
 * @param box - The bounding box
 * @param start - Ray start point
 * @param end - Ray end point
 * @returns true if the ray intersects the box, false otherwise
 */
export function intersectsRay(box: Box3, start: Vec3, end: Vec3): boolean {
    const min = box[0];
    const max = box[1];
    
    // Ray direction and inverse direction
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];
    
    // Handle degenerate ray (start == end)
    if (dx === 0 && dy === 0 && dz === 0) {
        // Point in box test
        return start[0] >= min[0] && start[0] <= max[0] &&
               start[1] >= min[1] && start[1] <= max[1] &&
               start[2] >= min[2] && start[2] <= max[2];
    }
    
    let tMin = 0;
    let tMax = 1; // We only care about the segment from start to end
    
    // X axis
    if (dx === 0) {
        // Ray is parallel to X axis
        if (start[0] < min[0] || start[0] > max[0]) return false;
    } else {
        const invDx = 1 / dx;
        let t1 = (min[0] - start[0]) * invDx;
        let t2 = (max[0] - start[0]) * invDx;
        if (t1 > t2) [t1, t2] = [t2, t1]; // swap
        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) return false;
    }
    
    // Y axis
    if (dy === 0) {
        // Ray is parallel to Y axis
        if (start[1] < min[1] || start[1] > max[1]) return false;
    } else {
        const invDy = 1 / dy;
        let t1 = (min[1] - start[1]) * invDy;
        let t2 = (max[1] - start[1]) * invDy;
        if (t1 > t2) [t1, t2] = [t2, t1]; // swap
        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) return false;
    }
    
    // Z axis
    if (dz === 0) {
        // Ray is parallel to Z axis
        if (start[2] < min[2] || start[2] > max[2]) return false;
    } else {
        const invDz = 1 / dz;
        let t1 = (min[2] - start[2]) * invDz;
        let t2 = (max[2] - start[2]) * invDz;
        if (t1 > t2) [t1, t2] = [t2, t1]; // swap
        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) return false;
    }
    
    // Ray intersects if tMin <= tMax and the intersection is within the segment [0, 1]
    return tMax >= 0 && tMin <= 1;
}

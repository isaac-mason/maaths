import * as mat3 from './mat3';
import * as mat4 from './mat4';
import * as quat from './quat';
import type { Box3, Mat3, Mat4, OBB3, Quat, Vec3 } from './types';
import * as vec3 from './vec3';

export function create(): OBB3 {
    return { center: [0, 0, 0], halfExtents: [1, 1, 1], quaternion: [0, 0, 0, 1] };
}

export function clone(a: OBB3): OBB3 {
    return {
        center: [a.center[0], a.center[1], a.center[2]],
        halfExtents: [a.halfExtents[0], a.halfExtents[1], a.halfExtents[2]],
        quaternion: [a.quaternion[0], a.quaternion[1], a.quaternion[2], a.quaternion[3]],
    };
}

export function copy(out: OBB3, a: OBB3): OBB3 {
    out.center[0] = a.center[0];
    out.center[1] = a.center[1];
    out.center[2] = a.center[2];
    out.halfExtents[0] = a.halfExtents[0];
    out.halfExtents[1] = a.halfExtents[1];
    out.halfExtents[2] = a.halfExtents[2];
    out.quaternion[0] = a.quaternion[0];
    out.quaternion[1] = a.quaternion[1];
    out.quaternion[2] = a.quaternion[2];
    out.quaternion[3] = a.quaternion[3];
    return out;
}

export function set(out: OBB3, center: Vec3, halfExtents: Vec3, quaternion: Quat): OBB3 {
    out.center[0] = center[0];
    out.center[1] = center[1];
    out.center[2] = center[2];
    out.halfExtents[0] = halfExtents[0];
    out.halfExtents[1] = halfExtents[1];
    out.halfExtents[2] = halfExtents[2];
    out.quaternion[0] = quaternion[0];
    out.quaternion[1] = quaternion[1];
    out.quaternion[2] = quaternion[2];
    out.quaternion[3] = quaternion[3];
    return out;
}

/**
 * Creates an OBB from an axis-aligned bounding box (AABB).
 * The resulting OBB will have the same center and extents as the AABB,
 * with no rotation (identity orientation).
 *
 * @param out - The OBB to store the result
 * @param aabb - The AABB (min and max corners)
 * @returns out
 */
export function setFromBox3(out: OBB3, aabb: Box3): OBB3 {
    const min = aabb[0];
    const max = aabb[1];

    // Center = (min + max) / 2
    out.center[0] = (min[0] + max[0]) * 0.5;
    out.center[1] = (min[1] + max[1]) * 0.5;
    out.center[2] = (min[2] + max[2]) * 0.5;

    // Half extents = (max - min) / 2
    out.halfExtents[0] = (max[0] - min[0]) * 0.5;
    out.halfExtents[1] = (max[1] - min[1]) * 0.5;
    out.halfExtents[2] = (max[2] - min[2]) * 0.5;

    // Identity rotation
    out.quaternion[0] = 0;
    out.quaternion[1] = 0;
    out.quaternion[2] = 0;
    out.quaternion[3] = 1;

    return out;
}

/**
 * Tests whether a point is contained within an OBB.
 *
 * @param obb - The OBB to test
 * @param point - The point to test
 * @returns true if the point is inside the OBB
 */
export function containsPoint(obb: OBB3, point: Vec3): boolean {
    // Transform point to OBB's local space
    const localPoint: Vec3 = [0, 0, 0];
    vec3.subtract(localPoint, point, obb.center);

    // Get inverse quaternion for rotation
    const invQuat: Quat = [0, 0, 0, 1];
    quat.invert(invQuat, obb.quaternion);
    vec3.transformQuat(localPoint, localPoint, invQuat);

    // Check if local coordinates are within half extents
    return (
        Math.abs(localPoint[0]) <= obb.halfExtents[0] &&
        Math.abs(localPoint[1]) <= obb.halfExtents[1] &&
        Math.abs(localPoint[2]) <= obb.halfExtents[2]
    );
}

/**
 * Clamps a point to the surface or interior of an OBB.
 * Reference: Closest Point on OBB to Point in Real-Time Collision Detection
 * by Christer Ericson (chapter 5.1.4)
 *
 * @param out - The clamped point result
 * @param obb - The OBB
 * @param point - The point to clamp
 * @returns out
 */
export function clampPoint(out: Vec3, obb: OBB3, point: Vec3): Vec3 {
    // Get OBB basis vectors
    const rotation: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    mat3.fromQuat(rotation, obb.quaternion);

    const xAxis: Vec3 = [rotation[0], rotation[1], rotation[2]];
    const yAxis: Vec3 = [rotation[3], rotation[4], rotation[5]];
    const zAxis: Vec3 = [rotation[6], rotation[7], rotation[8]];

    // Vector from center to point
    const d: Vec3 = [0, 0, 0];
    vec3.subtract(d, point, obb.center);

    // Start at center
    vec3.copy(out, obb.center);

    // Project onto each axis and clamp
    let dist = vec3.dot(d, xAxis);
    dist = Math.max(-obb.halfExtents[0], Math.min(obb.halfExtents[0], dist));
    out[0] += xAxis[0] * dist;
    out[1] += xAxis[1] * dist;
    out[2] += xAxis[2] * dist;

    dist = vec3.dot(d, yAxis);
    dist = Math.max(-obb.halfExtents[1], Math.min(obb.halfExtents[1], dist));
    out[0] += yAxis[0] * dist;
    out[1] += yAxis[1] * dist;
    out[2] += yAxis[2] * dist;

    dist = vec3.dot(d, zAxis);
    dist = Math.max(-obb.halfExtents[2], Math.min(obb.halfExtents[2], dist));
    out[0] += zAxis[0] * dist;
    out[1] += zAxis[1] * dist;
    out[2] += zAxis[2] * dist;

    return out;
}

/**
 * Tests whether an OBB intersects with another OBB using the Separating Axis Theorem.
 * Reference: OBB-OBB Intersection in Real-Time Collision Detection
 * by Christer Ericson (chapter 4.4.1)
 *
 * @param a - The first OBB
 * @param b - The second OBB
 * @param epsilon - Small value to prevent arithmetic errors when edges are parallel
 * @returns true if the OBBs intersect
 */
export function intersectsOBB3(a: OBB3, b: OBB3, epsilon = Number.EPSILON): boolean {
    // Get basis vectors for both OBBs
    const rotA: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const rotB: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    mat3.fromQuat(rotA, a.quaternion);
    mat3.fromQuat(rotB, b.quaternion);

    // Extract axes (columns of rotation matrix)
    const aU: [Vec3, Vec3, Vec3] = [
        [rotA[0], rotA[1], rotA[2]],
        [rotA[3], rotA[4], rotA[5]],
        [rotA[6], rotA[7], rotA[8]],
    ];
    const bU: [Vec3, Vec3, Vec3] = [
        [rotB[0], rotB[1], rotB[2]],
        [rotB[3], rotB[4], rotB[5]],
        [rotB[6], rotB[7], rotB[8]],
    ];

    // Compute rotation matrix expressing b in a's coordinate frame
    const R: number[][] = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            R[i][j] = vec3.dot(aU[i], bU[j]);
        }
    }

    // Translation vector
    const t: Vec3 = [0, 0, 0];
    vec3.subtract(t, b.center, a.center);

    // Bring translation into a's coordinate frame
    const tInA: Vec3 = [vec3.dot(t, aU[0]), vec3.dot(t, aU[1]), vec3.dot(t, aU[2])];

    // Compute common subexpressions with epsilon
    const AbsR: number[][] = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            AbsR[i][j] = Math.abs(R[i][j]) + epsilon;
        }
    }

    let ra: number, rb: number;

    // Test axes L = A0, L = A1, L = A2
    for (let i = 0; i < 3; i++) {
        ra = a.halfExtents[i];
        rb = b.halfExtents[0] * AbsR[i][0] + b.halfExtents[1] * AbsR[i][1] + b.halfExtents[2] * AbsR[i][2];
        if (Math.abs(tInA[i]) > ra + rb) return false;
    }

    // Test axes L = B0, L = B1, L = B2
    for (let i = 0; i < 3; i++) {
        ra = a.halfExtents[0] * AbsR[0][i] + a.halfExtents[1] * AbsR[1][i] + a.halfExtents[2] * AbsR[2][i];
        rb = b.halfExtents[i];
        if (Math.abs(tInA[0] * R[0][i] + tInA[1] * R[1][i] + tInA[2] * R[2][i]) > ra + rb) return false;
    }

    // Test axis L = A0 x B0
    ra = a.halfExtents[1] * AbsR[2][0] + a.halfExtents[2] * AbsR[1][0];
    rb = b.halfExtents[1] * AbsR[0][2] + b.halfExtents[2] * AbsR[0][1];
    if (Math.abs(tInA[2] * R[1][0] - tInA[1] * R[2][0]) > ra + rb) return false;

    // Test axis L = A0 x B1
    ra = a.halfExtents[1] * AbsR[2][1] + a.halfExtents[2] * AbsR[1][1];
    rb = b.halfExtents[0] * AbsR[0][2] + b.halfExtents[2] * AbsR[0][0];
    if (Math.abs(tInA[2] * R[1][1] - tInA[1] * R[2][1]) > ra + rb) return false;

    // Test axis L = A0 x B2
    ra = a.halfExtents[1] * AbsR[2][2] + a.halfExtents[2] * AbsR[1][2];
    rb = b.halfExtents[0] * AbsR[0][1] + b.halfExtents[1] * AbsR[0][0];
    if (Math.abs(tInA[2] * R[1][2] - tInA[1] * R[2][2]) > ra + rb) return false;

    // Test axis L = A1 x B0
    ra = a.halfExtents[0] * AbsR[2][0] + a.halfExtents[2] * AbsR[0][0];
    rb = b.halfExtents[1] * AbsR[1][2] + b.halfExtents[2] * AbsR[1][1];
    if (Math.abs(tInA[0] * R[2][0] - tInA[2] * R[0][0]) > ra + rb) return false;

    // Test axis L = A1 x B1
    ra = a.halfExtents[0] * AbsR[2][1] + a.halfExtents[2] * AbsR[0][1];
    rb = b.halfExtents[0] * AbsR[1][2] + b.halfExtents[2] * AbsR[1][0];
    if (Math.abs(tInA[0] * R[2][1] - tInA[2] * R[0][1]) > ra + rb) return false;

    // Test axis L = A1 x B2
    ra = a.halfExtents[0] * AbsR[2][2] + a.halfExtents[2] * AbsR[0][2];
    rb = b.halfExtents[0] * AbsR[1][1] + b.halfExtents[1] * AbsR[1][0];
    if (Math.abs(tInA[0] * R[2][2] - tInA[2] * R[0][2]) > ra + rb) return false;

    // Test axis L = A2 x B0
    ra = a.halfExtents[0] * AbsR[1][0] + a.halfExtents[1] * AbsR[0][0];
    rb = b.halfExtents[1] * AbsR[2][2] + b.halfExtents[2] * AbsR[2][1];
    if (Math.abs(tInA[1] * R[0][0] - tInA[0] * R[1][0]) > ra + rb) return false;

    // Test axis L = A2 x B1
    ra = a.halfExtents[0] * AbsR[1][1] + a.halfExtents[1] * AbsR[0][1];
    rb = b.halfExtents[0] * AbsR[2][2] + b.halfExtents[2] * AbsR[2][0];
    if (Math.abs(tInA[1] * R[0][1] - tInA[0] * R[1][1]) > ra + rb) return false;

    // Test axis L = A2 x B2
    ra = a.halfExtents[0] * AbsR[1][2] + a.halfExtents[1] * AbsR[0][2];
    rb = b.halfExtents[0] * AbsR[2][1] + b.halfExtents[1] * AbsR[2][0];
    if (Math.abs(tInA[1] * R[0][2] - tInA[0] * R[1][2]) > ra + rb) return false;

    // No separating axis found - OBBs must be intersecting
    return true;
}

/**
 * Tests whether an OBB intersects with an AABB.
 *
 * @param obb - The OBB
 * @param aabb - The AABB (axis-aligned bounding box)
 * @returns true if they intersect
 */
export function intersectsBox3(obb: OBB3, aabb: Box3): boolean {
    // Convert AABB to OBB and test
    const obbFromAABB = create();
    setFromBox3(obbFromAABB, aabb);
    return intersectsOBB3(obb, obbFromAABB);
}

/**
 * Applies a 4x4 transformation matrix to an OBB.
 * This can be used to transform the bounding volume with the world matrix
 * of a 3D object to keep both entities in sync.
 *
 * @param out - The transformed OBB
 * @param obb - The OBB to transform
 * @param matrix - The 4x4 transformation matrix
 * @returns out
 */
export function applyMatrix4(out: OBB3, obb: OBB3, matrix: Mat4): OBB3 {
    const e = matrix;

    // Extract scale from matrix
    let sx = Math.sqrt(e[0] * e[0] + e[1] * e[1] + e[2] * e[2]);
    const sy = Math.sqrt(e[4] * e[4] + e[5] * e[5] + e[6] * e[6]);
    const sz = Math.sqrt(e[8] * e[8] + e[9] * e[9] + e[10] * e[10]);

    // Handle negative scale (reflection)
    const det = mat4.determinant(matrix);
    if (det < 0) sx = -sx;

    // Extract rotation
    const rotationMat: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    mat3.fromMat4(rotationMat, matrix);

    // Remove scale from rotation
    const invSX = 1 / sx;
    const invSY = 1 / sy;
    const invSZ = 1 / sz;

    rotationMat[0] *= invSX;
    rotationMat[1] *= invSX;
    rotationMat[2] *= invSX;
    rotationMat[3] *= invSY;
    rotationMat[4] *= invSY;
    rotationMat[5] *= invSY;
    rotationMat[6] *= invSZ;
    rotationMat[7] *= invSZ;
    rotationMat[8] *= invSZ;

    // Combine rotations
    const currentRot: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    mat3.fromQuat(currentRot, obb.quaternion);
    mat3.multiply(currentRot, currentRot, rotationMat);
    quat.fromMat3(out.quaternion, currentRot);
    quat.normalize(out.quaternion, out.quaternion);

    // Scale half extents
    out.halfExtents[0] = obb.halfExtents[0] * Math.abs(sx);
    out.halfExtents[1] = obb.halfExtents[1] * Math.abs(sy);
    out.halfExtents[2] = obb.halfExtents[2] * Math.abs(sz);

    // Transform center
    const translation: Vec3 = [e[12], e[13], e[14]];
    vec3.add(out.center, obb.center, translation);

    return out;
}

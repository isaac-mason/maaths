const EPSILON = 1e-12;

/**
 * Computes the convex hull of a set of 3D points using the QuickHull algorithm.
 * @param points An array of numbers representing the 3D points (x1, y1, z1, x2, y2, z2, ...)
 * @returns An array of indices representing the triangles of the convex hull (i1, j1, k1, i2, j2, k2, ...).
 */
export function fromPoints(points: number[]): number[] {
    const n = points.length / 3;
    if (n < 4) return [];

    // Find initial tetrahedron (extremal points)
    const initial = findInitialTetrahedron(points, n);
    if (!initial) return [];

    const { v0, v1, v2, v3 } = initial;

    // Create faces of initial tetrahedron
    // Each face represented as [v0, v1, v2, normal, offset, outsideSet[]]
    const faces: Face[] = [];
    const unassigned: number[] = [];

    // Populate unassigned points
    for (let i = 0; i < n; i++) {
        if (i !== v0 && i !== v1 && i !== v2 && i !== v3) {
            unassigned.push(i);
        }
    }

    // Create 4 faces of tetrahedron with outward normals
    // First, check orientation - compute normal of (v0,v1,v2) and see if v3 is on positive side
    const testNormal: [number, number, number] = [0, 0, 0];
    const testOffset = computePlane(points, v0, v1, v2, testNormal);
    const dist = pointToPlaneDistance(points, v3, testNormal, testOffset);

    if (dist < 0) {
        // v3 is on negative side, so normal points outward
        // Create faces in ccw order when viewed from outside
        addFace(faces, points, v0, v1, v2, unassigned);
        addFace(faces, points, v3, v1, v0, unassigned);
        addFace(faces, points, v3, v2, v1, unassigned);
        addFace(faces, points, v3, v0, v2, unassigned);
    } else {
        // v3 is on positive side, so normal points inward - reverse base face
        addFace(faces, points, v0, v2, v1, unassigned);
        addFace(faces, points, v3, v0, v1, unassigned);
        addFace(faces, points, v3, v1, v2, unassigned);
        addFace(faces, points, v3, v2, v0, unassigned);
    }

    // QuickHull main loop
    while (faces.length > 0) {
        // Find face with most distant outside point
        let maxDist = -Infinity;
        let maxFaceIdx = -1;
        let maxPointIdx = -1;

        for (let i = 0; i < faces.length; i++) {
            const face = faces[i];
            for (let j = 0; j < face.outside.length; j++) {
                const idx = face.outside[j];
                const dist = pointToPlaneDistance(points, idx, face.normal, face.offset);
                if (dist > maxDist) {
                    maxDist = dist;
                    maxFaceIdx = i;
                    maxPointIdx = idx;
                }
            }
        }

        if (maxFaceIdx === -1) break;

        // Remove visible faces and build horizon
        const visible: Face[] = [];
        const horizon: [number, number][] = [];
        markVisibleFaces(faces, points, maxPointIdx, maxFaceIdx, visible);

        // Build horizon edges (edges between visible and non-visible faces)
        for (const vf of visible) {
            checkEdge(vf.v0, vf.v1, visible, horizon);
            checkEdge(vf.v1, vf.v2, visible, horizon);
            checkEdge(vf.v2, vf.v0, visible, horizon);
        }

        // Collect outside points from visible faces
        const outsidePoints: number[] = [];
        for (const vf of visible) {
            for (const pt of vf.outside) {
                if (pt !== maxPointIdx) {
                    outsidePoints.push(pt);
                }
            }
        }

        // Remove visible faces
        for (let i = faces.length - 1; i >= 0; i--) {
            if (visible.includes(faces[i])) {
                faces.splice(i, 1);
            }
        }

        // Create new faces from horizon edges to apex
        for (const [e0, e1] of horizon) {
            addFace(faces, points, e0, e1, maxPointIdx, outsidePoints);
        }
    }

    // Extract triangle indices from remaining faces
    const result: number[] = [];
    for (const face of faces) {
        result.push(face.v0, face.v1, face.v2);
    }

    return result;
}

interface Face {
    v0: number;
    v1: number;
    v2: number;
    normal: [number, number, number];
    offset: number;
    outside: number[];
}

function findInitialTetrahedron(points: number[], n: number) {
    if (n < 4) return null;

    // Find extremal points along each axis
    let minX = 0,
        maxX = 0,
        minY = 0,
        maxY = 0,
        minZ = 0,
        maxZ = 0;

    for (let i = 0; i < n; i++) {
        const x = points[i * 3];
        const y = points[i * 3 + 1];
        const z = points[i * 3 + 2];

        if (x < points[minX * 3]) minX = i;
        if (x > points[maxX * 3]) maxX = i;
        if (y < points[minY * 3 + 1]) minY = i;
        if (y > points[maxY * 3 + 1]) maxY = i;
        if (z < points[minZ * 3 + 2]) minZ = i;
        if (z > points[maxZ * 3 + 2]) maxZ = i;
    }

    // Find pair with maximum distance
    const candidates = [minX, maxX, minY, maxY, minZ, maxZ];
    let v0 = 0,
        v1 = 1;
    let maxDist = 0;

    for (let i = 0; i < candidates.length; i++) {
        for (let j = i + 1; j < candidates.length; j++) {
            const dist = distanceSquared(points, candidates[i], candidates[j]);
            if (dist > maxDist) {
                maxDist = dist;
                v0 = candidates[i];
                v1 = candidates[j];
            }
        }
    }

    if (maxDist < EPSILON) return null;

    // Find third point with max distance to line v0-v1
    let v2 = -1;
    maxDist = 0;
    for (let i = 0; i < n; i++) {
        if (i === v0 || i === v1) continue;
        const dist = pointToLineDistanceSquared(points, i, v0, v1);
        if (dist > maxDist) {
            maxDist = dist;
            v2 = i;
        }
    }

    if (v2 === -1 || maxDist < EPSILON) return null;

    // Find fourth point with max distance to plane v0-v1-v2
    let v3 = -1;
    maxDist = 0;
    const normal: [number, number, number] = [0, 0, 0];
    const offset = computePlane(points, v0, v1, v2, normal);

    for (let i = 0; i < n; i++) {
        if (i === v0 || i === v1 || i === v2) continue;
        const dist = Math.abs(pointToPlaneDistance(points, i, normal, offset));
        if (dist > maxDist) {
            maxDist = dist;
            v3 = i;
        }
    }

    if (v3 === -1 || maxDist < EPSILON) return null;

    return { v0, v1, v2, v3 };
}

function addFace(faces: Face[], points: number[], v0: number, v1: number, v2: number, candidates: number[]): void {
    const normal: [number, number, number] = [0, 0, 0];
    const offset = computePlane(points, v0, v1, v2, normal);

    const outside: number[] = [];
    for (const idx of candidates) {
        if (idx === v0 || idx === v1 || idx === v2) continue;
        const dist = pointToPlaneDistance(points, idx, normal, offset);
        if (dist > EPSILON) {
            outside.push(idx);
        }
    }

    faces.push({ v0, v1, v2, normal, offset, outside });
}

function computePlane(
    points: number[],
    v0: number,
    v1: number,
    v2: number,
    outNormal: [number, number, number],
): number {
    const p0x = points[v0 * 3];
    const p0y = points[v0 * 3 + 1];
    const p0z = points[v0 * 3 + 2];
    const p1x = points[v1 * 3];
    const p1y = points[v1 * 3 + 1];
    const p1z = points[v1 * 3 + 2];
    const p2x = points[v2 * 3];
    const p2y = points[v2 * 3 + 1];
    const p2z = points[v2 * 3 + 2];

    // Edge vectors
    const e1x = p1x - p0x;
    const e1y = p1y - p0y;
    const e1z = p1z - p0z;
    const e2x = p2x - p0x;
    const e2y = p2y - p0y;
    const e2z = p2z - p0z;

    // Cross product
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;

    // Normalize
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (len < EPSILON) {
        outNormal[0] = 0;
        outNormal[1] = 0;
        outNormal[2] = 1;
        return 0;
    }

    const invLen = 1 / len;
    outNormal[0] = nx * invLen;
    outNormal[1] = ny * invLen;
    outNormal[2] = nz * invLen;

    // Plane offset: -dot(normal, p0)
    return -(outNormal[0] * p0x + outNormal[1] * p0y + outNormal[2] * p0z);
}

function pointToPlaneDistance(points: number[], idx: number, normal: [number, number, number], offset: number): number {
    const x = points[idx * 3];
    const y = points[idx * 3 + 1];
    const z = points[idx * 3 + 2];
    return normal[0] * x + normal[1] * y + normal[2] * z + offset;
}

function distanceSquared(points: number[], i: number, j: number): number {
    const dx = points[i * 3] - points[j * 3];
    const dy = points[i * 3 + 1] - points[j * 3 + 1];
    const dz = points[i * 3 + 2] - points[j * 3 + 2];
    return dx * dx + dy * dy + dz * dz;
}

function pointToLineDistanceSquared(points: number[], idx: number, v0: number, v1: number): number {
    const px = points[idx * 3];
    const py = points[idx * 3 + 1];
    const pz = points[idx * 3 + 2];
    const ax = points[v0 * 3];
    const ay = points[v0 * 3 + 1];
    const az = points[v0 * 3 + 2];
    const bx = points[v1 * 3];
    const by = points[v1 * 3 + 1];
    const bz = points[v1 * 3 + 2];

    // Vector from a to p
    const apx = px - ax;
    const apy = py - ay;
    const apz = pz - az;

    // Vector from a to b
    const abx = bx - ax;
    const aby = by - ay;
    const abz = bz - az;

    // Cross product ap × ab
    const cx = apy * abz - apz * aby;
    const cy = apz * abx - apx * abz;
    const cz = apx * aby - apy * abx;

    const crossLenSq = cx * cx + cy * cy + cz * cz;
    const abLenSq = abx * abx + aby * aby + abz * abz;

    if (abLenSq < EPSILON) return apx * apx + apy * apy + apz * apz;

    return crossLenSq / abLenSq;
}

function markVisibleFaces(faces: Face[], points: number[], apex: number, seedIdx: number, visible: Face[]): void {
    const queue: Face[] = [faces[seedIdx]];
    const visited = new Set<Face>();

    while (queue.length > 0) {
        const face = queue.shift()!;
        if (visited.has(face)) continue;
        visited.add(face);

        const dist = pointToPlaneDistance(points, apex, face.normal, face.offset);
        if (dist > EPSILON) {
            visible.push(face);

            // Check adjacent faces
            for (const other of faces) {
                if (visited.has(other) || visible.includes(other)) continue;

                // Check if faces share an edge
                const shared = countSharedVertices(face, other);
                if (shared === 2) {
                    queue.push(other);
                }
            }
        }
    }
}

function countSharedVertices(f1: Face, f2: Face): number {
    let count = 0;
    if (f1.v0 === f2.v0 || f1.v0 === f2.v1 || f1.v0 === f2.v2) count++;
    if (f1.v1 === f2.v0 || f1.v1 === f2.v1 || f1.v1 === f2.v2) count++;
    if (f1.v2 === f2.v0 || f1.v2 === f2.v1 || f1.v2 === f2.v2) count++;
    return count;
}

function checkEdge(e0: number, e1: number, visible: Face[], horizon: [number, number][]): void {
    // Check if edge is on horizon (only belongs to one visible face)
    let count = 0;
    for (const vf of visible) {
        if (hasEdge(vf, e0, e1)) count++;
    }

    if (count === 1) {
        horizon.push([e0, e1]);
    }
}

function hasEdge(face: Face, e0: number, e1: number): boolean {
    return (
        (face.v0 === e0 && face.v1 === e1) ||
        (face.v1 === e0 && face.v2 === e1) ||
        (face.v2 === e0 && face.v0 === e1) ||
        (face.v0 === e1 && face.v1 === e0) ||
        (face.v1 === e1 && face.v2 === e0) ||
        (face.v2 === e1 && face.v0 === e0)
    );
}

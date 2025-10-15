const EPSILON = 1e-12;

/**
 * Computes the convex hull of a set of 2D points using the QuickHull algorithm.
 * The hull is returned as an array of indices in counter-clockwise order.
 *
 * @param points Flat array of 2D points: [x0, y0, x1, y1, ...]
 * @returns Indices of hull vertices in CCW order
 */
export function quickhull2(points: number[]): number[] {
    const n = points.length / 2;
    if (n < 3) return Array.from({ length: n }, (_, i) => i);

    // find leftmost and rightmost points
    let leftIdx = 0;
    let rightIdx = 0;
    let minX = points[0];
    let maxX = points[0];

    for (let i = 1; i < n; i++) {
        const x = points[i * 2];
        if (x < minX) {
            minX = x;
            leftIdx = i;
        }
        if (x > maxX) {
            maxX = x;
            rightIdx = i;
        }
    }

    if (Math.abs(maxX - minX) < EPSILON) return [leftIdx]; // all same x

    // partition points into upper/lower sets
    const upperSet: number[] = [];
    const lowerSet: number[] = [];

    for (let i = 0; i < n; i++) {
        if (i === leftIdx || i === rightIdx) continue;
        const orient = orientation(points, leftIdx, rightIdx, i);
        if (orient > EPSILON) upperSet.push(i);
        else if (orient < -EPSILON) lowerSet.push(i);
    }

    // build hull iteratively (explicit stack, no recursion)
    const hull: number[] = [leftIdx];
    quickHullIterative(points, leftIdx, rightIdx, upperSet, hull);
    hull.push(rightIdx);
    quickHullIterative(points, rightIdx, leftIdx, lowerSet, hull);

    return hull;
}

type StackFrame = {
    p1: number;
    p2: number;
    outsideSet: number[];
    insertPos: number;
};

/**
 * Iterative QuickHull subdivision step.
 * Expands the hull by finding the furthest point from a segment and
 * partitioning points on either side.
 */
function quickHullIterative(points: number[], p1: number, p2: number, outsideSet: number[], hull: number[]): void {
    if (outsideSet.length === 0) return;

    const stack: StackFrame[] = [{ p1, p2, outsideSet, insertPos: hull.length }];

    while (stack.length > 0) {
        const frame = stack.pop()!;
        const { p1, p2, outsideSet, insertPos } = frame;

        if (outsideSet.length === 0) continue;

        // find the point furthest from line (by perpendicular distance)
        let maxIdx = -1;
        let maxDist = EPSILON;

        for (const idx of outsideSet) {
            const dist = distanceToLine(points, p1, p2, idx);
            if (dist > maxDist) {
                maxDist = dist;
                maxIdx = idx;
            }
        }

        if (maxIdx === -1) continue;

        // partition remaining points
        const leftSet: number[] = [];
        const rightSet: number[] = [];

        for (const idx of outsideSet) {
            if (idx === maxIdx) continue;
            const orientLeft = orientation(points, p1, maxIdx, idx);
            const orientRight = orientation(points, maxIdx, p2, idx);
            if (orientLeft > EPSILON) leftSet.push(idx);
            else if (orientRight > EPSILON) rightSet.push(idx);
        }

        // insert max point into hull between p1 and p2
        hull.splice(insertPos, 0, maxIdx);

        // push right first so left is processed first (stack = LIFO)
        if (rightSet.length > 0) stack.push({ p1: maxIdx, p2, outsideSet: rightSet, insertPos: insertPos + 1 });

        if (leftSet.length > 0) stack.push({ p1, p2: maxIdx, outsideSet: leftSet, insertPos });
    }
}

/**
 * Returns the **unsigned** perpendicular distance from point p to line (p1, p2).
 */
function distanceToLine(points: number[], p1: number, p2: number, p: number): number {
    const x1 = points[p1 * 2],
        y1 = points[p1 * 2 + 1];
    const x2 = points[p2 * 2],
        y2 = points[p2 * 2 + 1];
    const xp = points[p * 2],
        yp = points[p * 2 + 1];
    const dx = x2 - x1,
        dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < EPSILON) return 0;
    return Math.abs((xp - x1) * (-dy / len) + (yp - y1) * (dx / len));
}

/**
 * Orientation test for three points.
 * > 0 => counter-clockwise turn
 * < 0 => clockwise turn
 * = 0 => collinear
 */
function orientation(points: number[], p1: number, p2: number, p3: number): number {
    const x1 = points[p1 * 2],
        y1 = points[p1 * 2 + 1];
    const x2 = points[p2 * 2],
        y2 = points[p2 * 2 + 1];
    const x3 = points[p3 * 2],
        y3 = points[p3 * 2 + 1];
    return (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
}

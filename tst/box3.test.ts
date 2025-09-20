import { describe, expect, it } from 'vitest';
import type { Box3, Plane3, Sphere, Triangle3, Vec3 } from '../dist';
import { box3 } from '../dist';

describe('box3', () => {
    describe('create', () => {
        it('should create an empty box with correct infinity values', () => {
            const box = box3.create();

            expect(box[0]).toEqual([Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY]);
            expect(box[1]).toEqual([Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY]);
        });

        it('should create a new instance each time', () => {
            const box1 = box3.create();
            const box2 = box3.create();

            expect(box1).not.toBe(box2);
            expect(box1[0]).not.toBe(box2[0]);
            expect(box1[1]).not.toBe(box2[1]);
        });
    });

    describe('clone', () => {
        it('should create an exact copy of the box', () => {
            const original: Box3 = [
                [1, 2, 3],
                [4, 5, 6],
            ];
            const cloned = box3.clone(original);

            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
            expect(cloned[0]).not.toBe(original[0]);
            expect(cloned[1]).not.toBe(original[1]);
        });

        it('should handle empty box', () => {
            const empty = box3.create();
            const cloned = box3.clone(empty);

            expect(cloned).toEqual(empty);
            expect(cloned).not.toBe(empty);
        });
    });

    describe('set', () => {
        it('should set min and max values correctly', () => {
            const box = box3.create();
            const min: Vec3 = [1, 2, 3];
            const max: Vec3 = [4, 5, 6];

            const result = box3.set(box, min, max);

            expect(result).toBe(box); // should return the same instance
            expect(box[0]).toEqual([1, 2, 3]);
            expect(box[1]).toEqual([4, 5, 6]);
        });

        it('should handle negative coordinates', () => {
            const box = box3.create();
            const min: Vec3 = [-3, -2, -1];
            const max: Vec3 = [1, 2, 3];

            box3.set(box, min, max);

            expect(box[0]).toEqual([-3, -2, -1]);
            expect(box[1]).toEqual([1, 2, 3]);
        });

        it('should handle zero-sized box', () => {
            const box = box3.create();
            const point: Vec3 = [1, 1, 1];

            box3.set(box, point, point);

            expect(box[0]).toEqual([1, 1, 1]);
            expect(box[1]).toEqual([1, 1, 1]);
        });
    });

    describe('setFromCenterAndSize', () => {
        it('should create box from center and size correctly', () => {
            const box = box3.create();
            const center: Vec3 = [5, 5, 5];
            const size: Vec3 = [4, 6, 2];

            const result = box3.setFromCenterAndSize(box, center, size);

            expect(result).toBe(box); // should return the same instance
            expect(box[0]).toEqual([3, 2, 4]); // center - halfSize
            expect(box[1]).toEqual([7, 8, 6]); // center + halfSize
        });

        it('should handle zero-sized box', () => {
            const box = box3.create();
            const center: Vec3 = [1, 2, 3];
            const size: Vec3 = [0, 0, 0];

            box3.setFromCenterAndSize(box, center, size);

            expect(box[0]).toEqual([1, 2, 3]);
            expect(box[1]).toEqual([1, 2, 3]);
        });

        it('should handle unit cube at origin', () => {
            const box = box3.create();
            const center: Vec3 = [0, 0, 0];
            const size: Vec3 = [2, 2, 2];

            box3.setFromCenterAndSize(box, center, size);

            expect(box[0]).toEqual([-1, -1, -1]);
            expect(box[1]).toEqual([1, 1, 1]);
        });

        it('should handle asymmetric size', () => {
            const box = box3.create();
            const center: Vec3 = [10, 20, 30];
            const size: Vec3 = [1, 100, 10];

            box3.setFromCenterAndSize(box, center, size);

            expect(box[0]).toEqual([9.5, -30, 25]);
            expect(box[1]).toEqual([10.5, 70, 35]);
        });

        it('should handle negative center coordinates', () => {
            const box = box3.create();
            const center: Vec3 = [-5, -10, -15];
            const size: Vec3 = [2, 4, 6];

            box3.setFromCenterAndSize(box, center, size);

            expect(box[0]).toEqual([-6, -12, -18]);
            expect(box[1]).toEqual([-4, -8, -12]);
        });
    });

    describe('expandByPoint', () => {
        it('should expand box to include point outside', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const result = box3.create();
            const point: Vec3 = [2, 2, 2];

            const returnValue = box3.expandByPoint(result, box, point);

            expect(returnValue).toBe(result); // should return the same instance
            expect(result[0]).toEqual([0, 0, 0]); // min unchanged
            expect(result[1]).toEqual([2, 2, 2]); // max expanded
        });

        it('should expand box to include point that extends min', () => {
            const box: Box3 = [
                [1, 1, 1],
                [2, 2, 2],
            ];
            const result = box3.create();
            const point: Vec3 = [0, 0, 0];

            box3.expandByPoint(result, box, point);

            expect(result[0]).toEqual([0, 0, 0]); // min expanded
            expect(result[1]).toEqual([2, 2, 2]); // max unchanged
        });

        it('should not change box when point is inside', () => {
            const box: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const result = box3.create();
            const point: Vec3 = [1, 1, 1];

            box3.expandByPoint(result, box, point);

            expect(result).toEqual(box); // no change
        });

        it('should handle point on box boundary', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const result = box3.create();
            const point: Vec3 = [0, 0, 1]; // on corner

            box3.expandByPoint(result, box, point);

            expect(result).toEqual(box); // no change needed
        });

        it('should expand only necessary dimensions', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const result = box3.create();
            const point: Vec3 = [2, 0.5, -1]; // extends X max and Z min

            box3.expandByPoint(result, box, point);

            expect(result[0]).toEqual([0, 0, -1]); // Z min expanded
            expect(result[1]).toEqual([2, 1, 1]); // X max expanded, Y unchanged
        });

        it('should handle expanding empty box', () => {
            const emptyBox = box3.create(); // starts with infinity values
            const result = box3.create();
            const point: Vec3 = [5, 5, 5];

            box3.expandByPoint(result, emptyBox, point);

            expect(result[0]).toEqual([5, 5, 5]); // point becomes min
            expect(result[1]).toEqual([5, 5, 5]); // point becomes max
        });

        it('should handle multiple expansions correctly', () => {
            let box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const temp = box3.create();

            // Expand by first point
            box3.expandByPoint(temp, box, [2, 0.5, 0.5]);
            box = box3.clone(temp);

            // Expand by second point
            box3.expandByPoint(temp, box, [-1, 2, 0.5]);
            box = box3.clone(temp);

            // Expand by third point
            box3.expandByPoint(temp, box, [1.5, 1.5, 3]);

            expect(temp[0]).toEqual([-1, 0, 0]);
            expect(temp[1]).toEqual([2, 2, 3]);
        });

        it('should handle negative coordinates', () => {
            const box: Box3 = [
                [-2, -2, -2],
                [-1, -1, -1],
            ];
            const result = box3.create();
            const point: Vec3 = [-3, 0, -0.5];

            box3.expandByPoint(result, box, point);

            expect(result[0]).toEqual([-3, -2, -2]); // X min expanded
            expect(result[1]).toEqual([-1, 0, -0.5]); // Y and Z max expanded
        });
    });

    describe('containsPoint', () => {
        it('should return true when point is inside box', () => {
            const box: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const point: Vec3 = [1, 1, 1];

            expect(box3.containsPoint(box, point)).toBe(true);
        });

        it('should return true when point is on box boundary', () => {
            const box: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const point: Vec3 = [0, 1, 2]; // on faces

            expect(box3.containsPoint(box, point)).toBe(true);
        });

        it('should return true when point is at box corner', () => {
            const box: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const point: Vec3 = [2, 2, 2]; // corner

            expect(box3.containsPoint(box, point)).toBe(true);
        });

        it('should return false when point is outside box on X axis', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const point: Vec3 = [2, 0.5, 0.5];

            expect(box3.containsPoint(box, point)).toBe(false);
        });

        it('should return false when point is outside box on Y axis', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const point: Vec3 = [0.5, 2, 0.5];

            expect(box3.containsPoint(box, point)).toBe(false);
        });

        it('should return false when point is outside box on Z axis', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const point: Vec3 = [0.5, 0.5, 2];

            expect(box3.containsPoint(box, point)).toBe(false);
        });

        it('should handle negative coordinates', () => {
            const box: Box3 = [
                [-2, -2, -2],
                [-1, -1, -1],
            ];
            const point: Vec3 = [-1.5, -1.5, -1.5];

            expect(box3.containsPoint(box, point)).toBe(true);
        });

        it('should handle zero-sized box (point)', () => {
            const box: Box3 = [
                [1, 1, 1],
                [1, 1, 1],
            ];
            const point: Vec3 = [1, 1, 1];

            expect(box3.containsPoint(box, point)).toBe(true);
        });

        it('should return false for zero-sized box with different point', () => {
            const box: Box3 = [
                [1, 1, 1],
                [1, 1, 1],
            ];
            const point: Vec3 = [1.1, 1, 1];

            expect(box3.containsPoint(box, point)).toBe(false);
        });
    });

    describe('containsBox3', () => {
        it('should return true when contained box is completely inside container', () => {
            const container: Box3 = [
                [0, 0, 0],
                [4, 4, 4],
            ];
            const contained: Box3 = [
                [1, 1, 1],
                [3, 3, 3],
            ];

            expect(box3.containsBox3(container, contained)).toBe(true);
        });

        it('should return true when boxes are identical', () => {
            const box: Box3 = [
                [1, 2, 3],
                [4, 5, 6],
            ];

            expect(box3.containsBox3(box, box)).toBe(true);
        });

        it('should return true when contained box touches container boundary', () => {
            const container: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const contained: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];

            expect(box3.containsBox3(container, contained)).toBe(true);
        });

        it('should return false when contained box extends beyond container on X axis', () => {
            const container: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const contained: Box3 = [
                [1, 1, 1],
                [3, 2, 2], // extends beyond X max
            ];

            expect(box3.containsBox3(container, contained)).toBe(false);
        });

        it('should return false when contained box extends beyond container on Y axis', () => {
            const container: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const contained: Box3 = [
                [1, 1, 1],
                [2, 3, 2], // extends beyond Y max
            ];

            expect(box3.containsBox3(container, contained)).toBe(false);
        });

        it('should return false when contained box extends beyond container on Z axis', () => {
            const container: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const contained: Box3 = [
                [1, 1, 1],
                [2, 2, 3], // extends beyond Z max
            ];

            expect(box3.containsBox3(container, contained)).toBe(false);
        });

        it('should return false when contained box extends before container on X axis', () => {
            const container: Box3 = [
                [1, 1, 1],
                [3, 3, 3],
            ];
            const contained: Box3 = [
                [0, 1, 1], // starts before X min
                [2, 2, 2],
            ];

            expect(box3.containsBox3(container, contained)).toBe(false);
        });

        it('should return false when contained box extends before container on Y axis', () => {
            const container: Box3 = [
                [1, 1, 1],
                [3, 3, 3],
            ];
            const contained: Box3 = [
                [1, 0, 1], // starts before Y min
                [2, 2, 2],
            ];

            expect(box3.containsBox3(container, contained)).toBe(false);
        });

        it('should return false when contained box extends before container on Z axis', () => {
            const container: Box3 = [
                [1, 1, 1],
                [3, 3, 3],
            ];
            const contained: Box3 = [
                [1, 1, 0], // starts before Z min
                [2, 2, 2],
            ];

            expect(box3.containsBox3(container, contained)).toBe(false);
        });

        it('should handle negative coordinates', () => {
            const container: Box3 = [
                [-5, -5, -5],
                [-1, -1, -1],
            ];
            const contained: Box3 = [
                [-4, -4, -4],
                [-2, -2, -2],
            ];

            expect(box3.containsBox3(container, contained)).toBe(true);
        });

        it('should return true for zero-sized boxes at same position', () => {
            const container: Box3 = [
                [1, 1, 1],
                [1, 1, 1],
            ];
            const contained: Box3 = [
                [1, 1, 1],
                [1, 1, 1],
            ];

            expect(box3.containsBox3(container, contained)).toBe(true);
        });

        it('should return false for zero-sized boxes at different positions', () => {
            const container: Box3 = [
                [1, 1, 1],
                [1, 1, 1],
            ];
            const contained: Box3 = [
                [2, 1, 1],
                [2, 1, 1],
            ];

            expect(box3.containsBox3(container, contained)).toBe(false);
        });

        it('should handle partially overlapping boxes', () => {
            const container: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const contained: Box3 = [
                [1, 1, 1],
                [3, 3, 3], // overlaps but extends beyond
            ];

            expect(box3.containsBox3(container, contained)).toBe(false);
        });
    });

    describe('intersectsBox3', () => {
        it('should return true for overlapping boxes', () => {
            const boxA: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const boxB: Box3 = [
                [1, 1, 1],
                [3, 3, 3],
            ];

            expect(box3.intersectsBox3(boxA, boxB)).toBe(true);
        });

        it('should return true for touching boxes (edge case)', () => {
            const boxA: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const boxB: Box3 = [
                [1, 0, 0],
                [2, 1, 1],
            ];

            expect(box3.intersectsBox3(boxA, boxB)).toBe(true);
        });

        it('should return false for non-overlapping boxes on X axis', () => {
            const boxA: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const boxB: Box3 = [
                [2, 0, 0],
                [3, 1, 1],
            ];

            expect(box3.intersectsBox3(boxA, boxB)).toBe(false);
        });

        it('should return false for non-overlapping boxes on Y axis', () => {
            const boxA: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const boxB: Box3 = [
                [0, 2, 0],
                [1, 3, 1],
            ];

            expect(box3.intersectsBox3(boxA, boxB)).toBe(false);
        });

        it('should return false for non-overlapping boxes on Z axis', () => {
            const boxA: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const boxB: Box3 = [
                [0, 0, 2],
                [1, 1, 3],
            ];

            expect(box3.intersectsBox3(boxA, boxB)).toBe(false);
        });

        it('should return true for identical boxes', () => {
            const boxA: Box3 = [
                [1, 2, 3],
                [4, 5, 6],
            ];
            const boxB: Box3 = [
                [1, 2, 3],
                [4, 5, 6],
            ];

            expect(box3.intersectsBox3(boxA, boxB)).toBe(true);
        });

        it('should return true when one box contains another', () => {
            const outer: Box3 = [
                [0, 0, 0],
                [4, 4, 4],
            ];
            const inner: Box3 = [
                [1, 1, 1],
                [2, 2, 2],
            ];

            expect(box3.intersectsBox3(outer, inner)).toBe(true);
            expect(box3.intersectsBox3(inner, outer)).toBe(true);
        });
    });

    describe('intersectsTriangle3', () => {
        it('should return false for empty box (quick reject)', () => {
            const emptyBox: Box3 = [
                [1, 1, 1],
                [0, 0, 0], // max < min
            ];
            const triangle: Triangle3 = [
                [0, 0, 0],
                [1, 0, 0],
                [0, 1, 0],
            ];

            expect(box3.intersectsTriangle3(emptyBox, triangle)).toBe(false);
        });

        it('should return true when triangle is completely inside box', () => {
            const box: Box3 = [
                [-2, -2, -2],
                [2, 2, 2],
            ];
            const triangle: Triangle3 = [
                [0, 0, 0],
                [0.5, 0, 0],
                [0, 0.5, 0],
            ];

            expect(box3.intersectsTriangle3(box, triangle)).toBe(true);
        });

        it('should return true when triangle intersects box', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const triangle: Triangle3 = [
                [-0.5, 0.5, 0.5],
                [1.5, 0.5, 0.5],
                [0.5, 1.5, 0.5],
            ];

            expect(box3.intersectsTriangle3(box, triangle)).toBe(true);
        });

        it('should return false when triangle is completely outside box', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const triangle: Triangle3 = [
                [2, 2, 2],
                [3, 2, 2],
                [2, 3, 2],
            ];

            expect(box3.intersectsTriangle3(box, triangle)).toBe(false);
        });

        it('should handle triangle with one vertex inside box', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const triangle: Triangle3 = [
                [0.5, 0.5, 0.5], // inside
                [2, 2, 2], // outside
                [3, 3, 3], // outside
            ];

            expect(box3.intersectsTriangle3(box, triangle)).toBe(true);
        });

        it('should handle degenerate triangle (all vertices same)', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const triangle: Triangle3 = [
                [0.5, 0.5, 0.5],
                [0.5, 0.5, 0.5],
                [0.5, 0.5, 0.5],
            ];

            expect(box3.intersectsTriangle3(box, triangle)).toBe(true);
        });

        it('should handle triangle that passes through box diagonally', () => {
            const box: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const triangle: Triangle3 = [
                [-1, -1, 1],
                [3, 1, 1],
                [1, 3, 1],
            ];

            expect(box3.intersectsTriangle3(box, triangle)).toBe(true);
        });
    });

    describe('intersectsSphere', () => {
        it('should return true when sphere center is inside box', () => {
            const box: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const sphere: Sphere = {
                center: [1, 1, 1], // center
                radius: 0.5, // radius
            };

            expect(box3.intersectsSphere(box, sphere)).toBe(true);
        });

        it('should return true when sphere intersects box corner', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const sphere: Sphere = {
                center: [2, 2, 2], // center outside
                radius: 2, // large enough radius to reach corner
            };

            expect(box3.intersectsSphere(box, sphere)).toBe(true);
        });

        it('should return true when sphere intersects box face', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const sphere: Sphere = {
                center: [2, 0.5, 0.5], // center outside on X face
                radius: 1.5, // radius reaches the face
            };

            expect(box3.intersectsSphere(box, sphere)).toBe(true);
        });

        it('should return true when sphere intersects box edge', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const sphere: Sphere = {
                center: [2, 2, 0.5], // center outside on edge
                radius: 1.5, // radius reaches the edge
            };

            expect(box3.intersectsSphere(box, sphere)).toBe(true);
        });

        it('should return false when sphere is completely outside box', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const sphere: Sphere = {
                center: [3, 3, 3], // center far away
                radius: 0.5, // small radius
            };

            expect(box3.intersectsSphere(box, sphere)).toBe(false);
        });

        it('should return true when sphere barely touches box corner', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const sphere: Sphere = {
                center: [2, 2, 2], // center at (2,2,2)
                radius: Math.sqrt(3) + 0.001, // radius slightly larger to account for floating point precision
            };

            expect(box3.intersectsSphere(box, sphere)).toBe(true);
        });

        it('should return false when sphere just misses box corner', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const sphere: Sphere = {
                center: [2, 2, 2], // center at (2,2,2)
                radius: Math.sqrt(3) - 0.01, // radius slightly less than distance to corner
            };

            expect(box3.intersectsSphere(box, sphere)).toBe(false);
        });

        it('should handle sphere with zero radius (point)', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const sphere: Sphere = {
                center: [0.5, 0.5, 0.5], // center inside
                radius: 0, // zero radius (point)
            };

            expect(box3.intersectsSphere(box, sphere)).toBe(true);
        });
    });

    describe('intersectsPlane3', () => {
        it('should return true when plane intersects box', () => {
            const box: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const plane: Plane3 = {
                normal: [1, 0, 0], // normal pointing along X axis
                constant: -1, // plane at x = 1 (normal.dot(point) + constant = 0)
            };

            expect(box3.intersectsPlane3(box, plane)).toBe(true);
        });
        
        it('should return false when plane is completely on positive side', () => {
            const box: Box3 = [
                [1, 1, 1],
                [2, 2, 2],
            ];
            const plane: Plane3 = {
                normal: [1, 0, 0], // normal pointing along X axis
                constant: 0.5, // plane at x = -0.5 (all box points have x >= 1)
            };

            expect(box3.intersectsPlane3(box, plane)).toBe(false);
        });
        
        it('should return false when plane is completely on negative side', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const plane: Plane3 = {
                normal: [1, 0, 0], // normal pointing along X axis
                constant: -2, // plane at x = 2 (all box points have x <= 1)
            };

            expect(box3.intersectsPlane3(box, plane)).toBe(false);
        });
        
        it('should return true when plane touches box corner', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const plane: Plane3 = {
                normal: [1, 1, 1], // diagonal normal
                constant: -Math.sqrt(3), // plane touching corner (1,1,1)
            };

            expect(box3.intersectsPlane3(box, plane)).toBe(true);
        });
        
        it('should handle plane with negative normal components', () => {
            const box: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const plane: Plane3 = {
                normal: [-1, -1, 0], // negative normal components
                constant: 1, // plane equation: -x - y + 1 = 0 => y = -x + 1
            };

            expect(box3.intersectsPlane3(box, plane)).toBe(true);
        });
        
        it('should handle plane parallel to box face', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const plane: Plane3 = {
                normal: [0, 1, 0], // normal along Y axis
                constant: -0.5, // plane at y = 0.5 (middle of box)
            };

            expect(box3.intersectsPlane3(box, plane)).toBe(true);
        });
        
        it('should handle arbitrary plane orientation', () => {
            const box: Box3 = [
                [-1, -1, -1],
                [1, 1, 1],
            ];
            const plane: Plane3 = {
                normal: [1, 2, 3], // arbitrary normal
                constant: 0, // plane passes through origin
            };

            expect(box3.intersectsPlane3(box, plane)).toBe(true);
        });
        
        it('should handle plane that just misses box', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const plane: Plane3 = {
                normal: [1, 0, 0], // normal along X axis
                constant: -1.1, // plane at x = 1.1 (just beyond box)
            };

            expect(box3.intersectsPlane3(box, plane)).toBe(false);
        });
    });

    describe('intersectsRay', () => {
        it('should return true when ray passes through box', () => {
            const box: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const start: Vec3 = [-1, 1, 1];
            const end: Vec3 = [3, 1, 1];
            
            expect(box3.intersectsRay(box, start, end)).toBe(true);
        });
        
        it('should return true when ray starts inside box', () => {
            const box: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const start: Vec3 = [1, 1, 1]; // inside box
            const end: Vec3 = [3, 3, 3]; // outside box
            
            expect(box3.intersectsRay(box, start, end)).toBe(true);
        });
        
        it('should return true when ray ends inside box', () => {
            const box: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const start: Vec3 = [-1, -1, -1]; // outside box
            const end: Vec3 = [1, 1, 1]; // inside box
            
            expect(box3.intersectsRay(box, start, end)).toBe(true);
        });
        
        it('should return false when ray misses box completely', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const start: Vec3 = [2, 2, 2];
            const end: Vec3 = [3, 3, 3];
            
            expect(box3.intersectsRay(box, start, end)).toBe(false);
        });
        
        it('should return true when ray touches box corner', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const start: Vec3 = [-1, -1, -1];
            const end: Vec3 = [1, 1, 1]; // exactly hits corner
            
            expect(box3.intersectsRay(box, start, end)).toBe(true);
        });
        
        it('should return true when ray touches box face', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const start: Vec3 = [-1, 0.5, 0.5];
            const end: Vec3 = [0, 0.5, 0.5]; // hits face at x=0
            
            expect(box3.intersectsRay(box, start, end)).toBe(true);
        });
        
        it('should handle degenerate ray (point)', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const point: Vec3 = [0.5, 0.5, 0.5];
            
            expect(box3.intersectsRay(box, point, point)).toBe(true);
        });
        
        it('should handle degenerate ray outside box', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const point: Vec3 = [2, 2, 2];
            
            expect(box3.intersectsRay(box, point, point)).toBe(false);
        });
        
        it('should handle ray parallel to box face', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const start: Vec3 = [0.5, -1, 0.5]; // parallel to Y axis
            const end: Vec3 = [0.5, 2, 0.5];
            
            expect(box3.intersectsRay(box, start, end)).toBe(true);
        });
        
        it('should handle ray parallel but missing box', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const start: Vec3 = [2, -1, 0.5]; // parallel to Y axis but outside
            const end: Vec3 = [2, 2, 0.5];
            
            expect(box3.intersectsRay(box, start, end)).toBe(false);
        });
        
        it('should handle diagonal ray through box', () => {
            const box: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const start: Vec3 = [-1, -1, -1];
            const end: Vec3 = [3, 3, 3]; // diagonal through box
            
            expect(box3.intersectsRay(box, start, end)).toBe(true);
        });
    });
});
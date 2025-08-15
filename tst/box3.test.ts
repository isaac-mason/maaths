import { describe, expect, it } from 'vitest';
import type { Box3, Plane3, Sphere3, Triangle3 } from '../dist';
import { box3 } from '../dist';

describe('box3', () => {
    describe('create', () => {
        it('should create an empty box with correct infinity values', () => {
            const box = box3.create();
            
            expect(box[0]).toEqual([
                Number.POSITIVE_INFINITY,
                Number.POSITIVE_INFINITY,
                Number.POSITIVE_INFINITY,
            ]);
            expect(box[1]).toEqual([
                Number.NEGATIVE_INFINITY,
                Number.NEGATIVE_INFINITY,
                Number.NEGATIVE_INFINITY,
            ]);
        });
        
        it('should create a new instance each time', () => {
            const box1 = box3.create();
            const box2 = box3.create();
            
            expect(box1).not.toBe(box2);
            expect(box1[0]).not.toBe(box2[0]);
            expect(box1[1]).not.toBe(box2[1]);
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

    describe('intersectsSphere3', () => {
        it('should return true when sphere center is inside box', () => {
            const box: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const sphere: Sphere3 = [
                [1, 1, 1], // center
                0.5, // radius
            ];
            
            expect(box3.intersectsSphere3(box, sphere)).toBe(true);
        });
        
        it('should return true when sphere intersects box corner', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const sphere: Sphere3 = [
                [2, 2, 2], // center outside
                2, // large enough radius to reach corner
            ];
            
            expect(box3.intersectsSphere3(box, sphere)).toBe(true);
        });
        
        it('should return true when sphere intersects box face', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const sphere: Sphere3 = [
                [2, 0.5, 0.5], // center outside on X face
                1.5, // radius reaches the face
            ];
            
            expect(box3.intersectsSphere3(box, sphere)).toBe(true);
        });
        
        it('should return true when sphere intersects box edge', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const sphere: Sphere3 = [
                [2, 2, 0.5], // center outside on edge
                1.5, // radius reaches the edge
            ];
            
            expect(box3.intersectsSphere3(box, sphere)).toBe(true);
        });
        
        it('should return false when sphere is completely outside box', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const sphere: Sphere3 = [
                [3, 3, 3], // center far away
                0.5, // small radius
            ];
            
            expect(box3.intersectsSphere3(box, sphere)).toBe(false);
        });
        
        it('should return true when sphere barely touches box corner', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const sphere: Sphere3 = [
                [2, 2, 2], // center at (2,2,2)
                Math.sqrt(3) + 0.001, // radius slightly larger to account for floating point precision
            ];
            
            expect(box3.intersectsSphere3(box, sphere)).toBe(true);
        });
        
        it('should return false when sphere just misses box corner', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const sphere: Sphere3 = [
                [2, 2, 2], // center at (2,2,2)
                Math.sqrt(3) - 0.01, // radius slightly less than distance to corner
            ];
            
            expect(box3.intersectsSphere3(box, sphere)).toBe(false);
        });
        
        it('should handle sphere with zero radius (point)', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const sphere: Sphere3 = [
                [0.5, 0.5, 0.5], // center inside
                0, // zero radius (point)
            ];
            
            expect(box3.intersectsSphere3(box, sphere)).toBe(true);
        });
    });

    describe('intersectsPlane3', () => {
        it('should return true when plane intersects box', () => {
            const box: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const plane: Plane3 = [
                [1, 0, 0], // normal pointing along X axis
                -1, // plane at x = 1 (normal.dot(point) + constant = 0)
            ];
            
            expect(box3.intersectsPlane3(box, plane)).toBe(true);
        });
        
        it('should return false when plane is completely on positive side', () => {
            const box: Box3 = [
                [1, 1, 1],
                [2, 2, 2],
            ];
            const plane: Plane3 = [
                [1, 0, 0], // normal pointing along X axis
                0.5, // plane at x = -0.5 (all box points have x >= 1)
            ];
            
            expect(box3.intersectsPlane3(box, plane)).toBe(false);
        });
        
        it('should return false when plane is completely on negative side', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const plane: Plane3 = [
                [1, 0, 0], // normal pointing along X axis
                -2, // plane at x = 2 (all box points have x <= 1)
            ];
            
            expect(box3.intersectsPlane3(box, plane)).toBe(false);
        });
        
        it('should return true when plane touches box corner', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const plane: Plane3 = [
                [1, 1, 1], // diagonal normal
                -Math.sqrt(3), // plane touching corner (1,1,1)
            ];
            
            expect(box3.intersectsPlane3(box, plane)).toBe(true);
        });
        
        it('should handle plane with negative normal components', () => {
            const box: Box3 = [
                [0, 0, 0],
                [2, 2, 2],
            ];
            const plane: Plane3 = [
                [-1, -1, 0], // negative normal components
                1, // plane equation: -x - y + 1 = 0 => y = -x + 1
            ];
            
            expect(box3.intersectsPlane3(box, plane)).toBe(true);
        });
        
        it('should handle plane parallel to box face', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const plane: Plane3 = [
                [0, 1, 0], // normal along Y axis
                -0.5, // plane at y = 0.5 (middle of box)
            ];
            
            expect(box3.intersectsPlane3(box, plane)).toBe(true);
        });
        
        it('should handle arbitrary plane orientation', () => {
            const box: Box3 = [
                [-1, -1, -1],
                [1, 1, 1],
            ];
            const plane: Plane3 = [
                [1, 2, 3], // arbitrary normal
                0, // plane passes through origin
            ];
            
            expect(box3.intersectsPlane3(box, plane)).toBe(true);
        });
        
        it('should handle plane that just misses box', () => {
            const box: Box3 = [
                [0, 0, 0],
                [1, 1, 1],
            ];
            const plane: Plane3 = [
                [1, 0, 0], // normal along X axis
                -1.1, // plane at x = 1.1 (just beyond box)
            ];
            
            expect(box3.intersectsPlane3(box, plane)).toBe(false);
        });
    });
});

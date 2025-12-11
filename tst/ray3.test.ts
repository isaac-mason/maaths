import { describe, expect, it } from 'vitest';
import type { Box3, Vec3, Ray3 } from '../dist';
import { ray3 } from '../dist';

describe('ray3', () => {
    describe('intersectsTriangle', () => {
        it('detects intersection with triangle directly in front of ray origin', () => {
            const ray: Ray3 = {
                origin: [0, 0, 0],
                direction: [0, 0, 1],
                length: 10,
            };

            const a: Vec3 = [-1, -1, 5];
            const b: Vec3 = [1, -1, 5];
            const c: Vec3 = [0, 1, 5];

            const result = { hit: false, fraction: 0 };
            ray3.intersectsTriangle(result, ray, a, b, c);

            expect(result.hit).toBe(true);
            expect(result.fraction).toBeGreaterThan(0);
            expect(result.fraction).toBeLessThan(1);
        });

        it('returns false when ray is parallel to triangle', () => {
            const ray: Ray3 = {
                origin: [0, 2, 0],
                direction: [1, 0, 0],
                length: 10,
            };

            const a: Vec3 = [0, 0, 0];
            const b: Vec3 = [1, 0, 0];
            const c: Vec3 = [0, 1, 0];

            const result = { hit: false, fraction: 0 };
            ray3.intersectsTriangle(result, ray, a, b, c);

            expect(result.hit).toBe(false);
        });

        it('returns false when intersection is behind ray origin', () => {
            const ray: Ray3 = {
                origin: [0, 0, 10],
                direction: [0, 0, 1],
                length: 5,
            };

            const a: Vec3 = [-1, -1, 5];
            const b: Vec3 = [1, -1, 5];
            const c: Vec3 = [0, 1, 5];

            const result = { hit: false, fraction: 0 };
            ray3.intersectsTriangle(result, ray, a, b, c);

            expect(result.hit).toBe(false);
        });

        it('returns false when intersection is beyond ray length', () => {
            const ray: Ray3 = {
                origin: [0, 0, 0],
                direction: [0, 0, 1],
                length: 3,
            };

            const a: Vec3 = [-1, -1, 5];
            const b: Vec3 = [1, -1, 5];
            const c: Vec3 = [0, 1, 5];

            const result = { hit: false, fraction: 0 };
            ray3.intersectsTriangle(result, ray, a, b, c);

            expect(result.hit).toBe(false);
        });

        it('detects intersection with edge of triangle (barycentric boundary)', () => {
            const ray: Ray3 = {
                origin: [0, 0, 0],
                direction: [0, 0, 1],
                length: 10,
            };

            const a: Vec3 = [-1, 0, 5];
            const b: Vec3 = [1, 0, 5];
            const c: Vec3 = [0, 1, 5];

            const result = { hit: false, fraction: 0 };
            ray3.intersectsTriangle(result, ray, a, b, c);

            expect(result.hit).toBe(true);
        });

        it('detects intersection with triangle at exact ray length', () => {
            const ray: Ray3 = {
                origin: [0, 0, 0],
                direction: [0, 0, 1],
                length: 5,
            };

            const a: Vec3 = [-1, -1, 5];
            const b: Vec3 = [1, -1, 5];
            const c: Vec3 = [0, 1, 5];

            const result = { hit: false, fraction: 0 };
            ray3.intersectsTriangle(result, ray, a, b, c);

            expect(result.hit).toBe(true);
            expect(result.fraction).toBeCloseTo(1.0, 5);
        });

        it('returns correct fraction for intersection point', () => {
            const ray: Ray3 = {
                origin: [0, 0, 0],
                direction: [0, 0, 1],
                length: 10,
            };

            const a: Vec3 = [-1, -1, 2.5];
            const b: Vec3 = [1, -1, 2.5];
            const c: Vec3 = [0, 1, 2.5];

            const result = { hit: false, fraction: 0 };
            ray3.intersectsTriangle(result, ray, a, b, c);

            expect(result.hit).toBe(true);
            expect(result.fraction).toBeCloseTo(0.25, 5);
        });
    });

    describe('intersectsBox3', () => {
        it('detects intersection with axis-aligned box in front of ray', () => {
            const ray: Ray3 = {
                origin: [0, 0, 0],
                direction: [0, 0, 1],
                length: 10,
            };

            const box: Box3 = [
                [-1, -1, 2],
                [1, 1, 4],
            ];

            expect(ray3.intersectsBox3(ray, box)).toBe(true);
        });

        it('returns false when box is behind ray origin', () => {
            const ray: Ray3 = {
                origin: [0, 0, 5],
                direction: [0, 0, 1],
                length: 5,
            };

            const box: Box3 = [
                [-1, -1, 0],
                [1, 1, 2],
            ];

            expect(ray3.intersectsBox3(ray, box)).toBe(false);
        });

        it('returns false when box is beyond ray length', () => {
            const ray: Ray3 = {
                origin: [0, 0, 0],
                direction: [0, 0, 1],
                length: 2,
            };

            const box: Box3 = [
                [-1, -1, 5],
                [1, 1, 7],
            ];

            expect(ray3.intersectsBox3(ray, box)).toBe(false);
        });

        it('detects intersection when ray origin is inside box', () => {
            const ray: Ray3 = {
                origin: [0, 0, 0],
                direction: [0, 0, 1],
                length: 10,
            };

            const box: Box3 = [
                [-1, -1, -1],
                [1, 1, 1],
            ];

            expect(ray3.intersectsBox3(ray, box)).toBe(true);
        });

        it('handles ray parallel to box faces (moving along x-axis)', () => {
            const ray: Ray3 = {
                origin: [0, 0, 0],
                direction: [1, 0, 0],
                length: 10,
            };

            const box: Box3 = [
                [-2, -1, -1],
                [2, 1, 1],
            ];

            expect(ray3.intersectsBox3(ray, box)).toBe(true);
        });

        it('returns false for ray parallel to box outside slab', () => {
            const ray: Ray3 = {
                origin: [0, 2, 0],
                direction: [1, 0, 0],
                length: 10,
            };

            const box: Box3 = [
                [-1, -1, -1],
                [1, 1, 1],
            ];

            expect(ray3.intersectsBox3(ray, box)).toBe(false);
        });

        it('detects intersection with diagonal ray through box', () => {
            const ray: Ray3 = {
                origin: [0, 0, 0],
                direction: [1, 1, 1],
                length: 10,
            };

            const box: Box3 = [
                [-1, -1, -1],
                [1, 1, 1],
            ];

            expect(ray3.intersectsBox3(ray, box)).toBe(true);
        });

        it('detects intersection when ray grazes box corner', () => {
            const ray: Ray3 = {
                origin: [-2, -2, -2],
                direction: [1, 1, 1],
                length: 10,
            };

            const box: Box3 = [
                [-1, -1, -1],
                [1, 1, 1],
            ];

            expect(ray3.intersectsBox3(ray, box)).toBe(true);
        });

        it('handles ray with negative direction components', () => {
            const ray: Ray3 = {
                origin: [2, 2, 2],
                direction: [-1, -1, -1],
                length: 10,
            };

            const box: Box3 = [
                [-1, -1, -1],
                [1, 1, 1],
            ];

            expect(ray3.intersectsBox3(ray, box)).toBe(true);
        });

        it('returns false when ray misses box entirely (x-axis)', () => {
            const ray: Ray3 = {
                origin: [0, 2, 0],
                direction: [1, 0, 0],
                length: 10,
            };

            const box: Box3 = [
                [0, -1, -1],
                [2, 1, 1],
            ];

            expect(ray3.intersectsBox3(ray, box)).toBe(false);
        });

        it('detects intersection at box boundary', () => {
            const ray: Ray3 = {
                origin: [-2, 0, 0],
                direction: [1, 0, 0],
                length: 5,
            };

            const box: Box3 = [
                [-1, -1, -1],
                [1, 1, 1],
            ];

            expect(ray3.intersectsBox3(ray, box)).toBe(true);
        });

        it('handles narrow boxes (line-like)', () => {
            const ray: Ray3 = {
                origin: [0.2, 0.2, 0],
                direction: [0, 0, 1],
                length: 10,
            };

            const box: Box3 = [
                [0, 0, 2],
                [0.1, 0.1, 4],
            ];

            expect(ray3.intersectsBox3(ray, box)).toBe(false);
        });
    });
});

/** A 2D vector */
export type Vec2 = [x: number, y: number];

/** A 3D vector */
export type Vec3 = [x: number, y: number, z: number];

/** A 4D vector */
export type Vec4 = [x: number, y: number, z: number, w: number];

/** A quaternion that represents rotation */
export type Quat = [x: number, y: number, z: number, w: number];

/** A dual quaternion that represents both rotation and translation */
export type Quat2 = [x: number, y: number, z: number, w: number, x2: number, y2: number, z2: number, w2: number];

/** A 2x2 matrix */
export type Mat2 = [e1: number, e2: number, e3: number, e4: number];

/** A 3x3 matrix */
export type Mat3 = [e1: number, e2: number, e3: number, e4: number, e5: number, e6: number, e7: number, e8: number, e9: number];

/** A 4x4 matrix */
export type Mat4 = [
    e1: number,
    e2: number,
    e3: number,
    e4: number,
    e5: number,
    e6: number,
    e7: number,
    e8: number,
    e9: number,
    e10: number,
    e11: number,
    e12: number,
    e13: number,
    e14: number,
    e15: number,
    e16: number,
];

/** A 2D affine transform matrix */
export type Mat2d = [e1: number, e2: number, e3: number, e4: number, e5: number, e6: number];

/** A box in 3D space */
export type Box3 = [min: Vec3, max: Vec3];

/** Euler orders */
export type EulerOrder = 'xyz' | 'xzy' | 'yxz' | 'yzx' | 'zxy' | 'zyx';

/** A Euler in 3D space, with an optional order (default is 'xyz') */
export type Euler = [x: number, y: number, z: number, order?: EulerOrder];

/** A triangle in 3D space */
export type Triangle3 = [a: Vec3, b: Vec3, c: Vec3];

/** A polygon in 3D space */
export type Poly3 = Vec3[];

/** A line segment in 3D space */
export type Segment3 = [start: Vec3, end: Vec3];

/** A ray in 3D space */
export type Ray3 = { origin: Vec3; direction: Vec3 };

/** A triangle in 2D space */
export type Triangle2 = [a: Vec2, b: Vec2, c: Vec2];

/** A polygon in 2D space */
export type Poly2 = Vec2[];

/** A line segment in 2D space */
export type Segment2 = [start: Vec2, end: Vec2];

/** A ray in 2D space */
export type Ray2 = { origin: Vec2; direction: Vec2 };

/**
 * A plane in 3D space
 * normal - a unit length vector defining the normal of the plane.
 * constant - the signed distance from the origin to the plane.
 */
export type Plane3 = { normal: Vec3; constant: number };

/** A sphere in 3D space */
export type Sphere = { center: Vec3; radius: number };

/** A circle in 2D space */
export type Circle = { center: Vec2; radius: number };

export type MutableArrayLike<T> = {
    [index: number]: T;
    length: number;
};

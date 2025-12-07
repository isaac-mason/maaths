import type { Box3, Triangle3, Vec3 } from './types';

export function create(): Triangle3 {
    return [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ];
}

export function copy(out: Triangle3, a: Triangle3): Triangle3 {
    out[0][0] = a[0][0];
    out[0][1] = a[0][1];
    out[0][2] = a[0][2];

    out[1][0] = a[1][0];
    out[1][1] = a[1][1];
    out[1][2] = a[1][2];

    out[2][0] = a[2][0];
    out[2][1] = a[2][1];
    out[2][2] = a[2][2];

    return out;
}

export function bounds(out: Box3, a: Vec3, b: Vec3, c: Vec3): Box3 {
    const [outMin, outMax] = out;

    outMin[0] = Math.min(a[0], b[0], c[0]);
    outMin[1] = Math.min(a[1], b[1], c[1]);
    outMin[2] = Math.min(a[2], b[2], c[2]);

    outMax[0] = Math.max(a[0], b[0], c[0]);
    outMax[1] = Math.max(a[1], b[1], c[1]);
    outMax[2] = Math.max(a[2], b[2], c[2]);

    return out;
}

export function normal(out: Vec3, a: Vec3, b: Vec3, c: Vec3): Vec3 {
    const abx = b[0] - a[0];
    const aby = b[1] - a[1];
    const abz = b[2] - a[2];

    const acx = c[0] - a[0];
    const acy = c[1] - a[1];
    const acz = c[2] - a[2];

    out[0] = aby * acz - abz * acy;
    out[1] = abz * acx - abx * acz;
    out[2] = abx * acy - aby * acx;

    const length = Math.sqrt(out[0] * out[0] + out[1] * out[1] + out[2] * out[2]);

    if (length > 0) {
        out[0] /= length;
        out[1] /= length;
        out[2] /= length;
    }

    return out;
}

export function centroid(out: Vec3, a: Vec3, b: Vec3, c: Vec3): Vec3 {
    out[0] = (a[0] + b[0] + c[0]) / 3;
    out[1] = (a[1] + b[1] + c[1]) / 3;
    out[2] = (a[2] + b[2] + c[2]) / 3;

    return out;
}

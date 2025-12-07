# CHANGELOG

## 0.0.7 (Unreleased)

- feat: add `ray3` module and `Ray3` type for rays with origin, direction, and length in 3D space
- feat: replace `box3.intersectsRay` with `ray3.intersectsBox3` for ray-box intersection tests
- feat: add `ray3.intersectsTriangle` for ray-triangle intersection tests in 3D space
- feat: move `circumcircle` module out of `triangle2`, export standalone
- feat: add `box3.copy` function to copy Box3 values to another Box3
- feat: add `box3.transformMat4`
- feat: add `triangle3.centroid`, `triangle3.normal`, `triangle3.bounds`
- feat: add `triangle3.copy`
- feat: add `triangle3.expandByExtents`
- feat: add `vec3.setScalar`
- feat: add `box3.extents`, `box3.center`
- feat: add `vec3.isScaleInsideOut`

## 0.0.6

- `maaths` has been renamed to `mathcat` to avoid confusion with `maath` from pmndrs.

## 0.0.5

- feat: add `OBB3` type and `obb3` APIs for 3D oriented bounding boxes
- feat: add `quickhull3` for computing 3D convex hulls
- feat: add `quickhull2` for computing 2D convex hulls
- feat: remove `Segment2` and `Segment3` types for now, pass Vec2/Vec3 pairs instead

## 0.0.1 - 0.0.4

- very early development, see git history

![cover](./docs/cover.png)

```sh
> npm install mathcat
```

# mathcat

mathcat is a collection of math helpers for 3D graphics and simulations.

**Features:**

- Vector, Quaternion, Euler, and Matrix math
- Easing functions
- Randomness utilities
- Noise utilities
- Simple JSON-serializable data structures (no classes or typed arrays)
- TypeScript-first, great DX for both JavaScript and TypeScript projects
- Excellent tree-shaking support

**Acknowledgements:**

- The vec*, quat*, mat* code started as a typescript port of glMatrix (https://glmatrix.net/). This library doesn't aim to stay in sync with glMatrix however.
- Simplex noise functions are adapted from https://github.com/pmndrs/maath, which were adapted from https://github.com/josephg/noisejs :)

## API Documentation

<RenderAPI />

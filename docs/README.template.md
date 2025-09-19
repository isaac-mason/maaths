# maaths

```sh
> npm install maaths
```

maaths is a collection of math helpers for 3D graphics and simulations.

## Overview

This library is an amalgamation of:
- A typescript fork of [glMatrix](https://glmatrix.net/)
- Noise functions
- Easing functions
- Randomness utilities
- ... other math-related helpers to come :)

Basically, this aims to become a "kitchen sink" library for math that is useful for graphics and simulations.

The goals of this library are to:
- Use simple json-serializable objects as data structures, no classes or typed arrays
- Have excellent tree shaking support by avoiding import coupling, avoiding classes with non-tree-shakable methods
- Be typescript-first, and therefore offer a great dx for both javascript and typescript projects

## Table Of Contents

<TOC />

## API Documentation

<RenderAPI />

## Acknowledgements

- The vec*, quat*, mat* code is a typescript port of glMatrix (https://glmatrix.net/). This library doesn't aim to stay in sync with glMatrix however.
- Simplex noise functions are adapted from https://github.com/pmndrs/maath, which were adapted from https://github.com/josephg/noisejs :)

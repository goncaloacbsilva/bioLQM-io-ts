# bioLQM-io-ts

TypeScript port of selected [bioLQM](https://github.com/colomoto/bioLQM) I/O packages.

This package currently includes `sbml` and `bnet`, plus the minimum additional `bioLQM` and `JSBML` classes required to load and save supported models.

## Overview

`bioLQM-io-ts` is a focused port of selected import/export layers from `bioLQM`.

The scope of this package is intentionally limited:

- `org.colomoto.biolqm.io.sbml`
- `org.colomoto.biolqm.io.bnet`
- the minimum `bioLQM` model and metadata classes needed by that package
- an internal `_jsbml` folder containing the translated subset of JSBML needed by the sbml package
- only the tests related to the supported packages

The package uses:

- Bun for dependency management
- Jest for tests
- `mddlib-ts` as a Git dependency for MDD operations

## Requirements

- [Bun](https://bun.sh/)

## Setup

Install dependencies:

```bash
bun install
```

This installs:

- `mddlib-ts` from GitHub
- `fast-xml-parser`
- `typescript`
- `jest`
- `ts-jest`
- `@types/jest`

## Build

Compile the package to `dist/`:

```bash
bun run build
```

This runs:

```bash
tsc -p tsconfig.json
```

Generated artifacts are written to:

- `dist/`

## Run Tests

Run the Jest suite:

```bash
bun test
```

or:

```bash
bun run test
```

Watch mode:

```bash
bun run test:watch
```

## How To Use

This package is intended to be consumed as a Git dependency from another TypeScript or JavaScript project.

### Add As A Dependency

Example `package.json` entry:

```json
{
  "dependencies": {
    "biolqm-io-ts": "git+https://github.com/goncaloacbsilva/bioLQM-io-ts.git"
  }
}
```

You can pin a branch, tag, or commit:

```json
{
  "dependencies": {
    "biolqm-io-ts": "git+https://github.com/goncaloacbsilva/bioLQM-io-ts.git#main"
  }
}
```

or:

```json
{
  "dependencies": {
    "biolqm-io-ts": "git+https://github.com/goncaloacbsilva/bioLQM-io-ts.git#<commit>"
  }
}
```

### Install In The Parent Project

```bash
bun install
```

The package `prepare` script builds the package during Git-based installation.

### Import From Your Project

Example:

```ts
import { BNetFormat, LQMServiceManager, SBMLFormat } from "biolqm-io-ts";
```

Example loading an SBML-qual file:

```ts
import { LQMServiceManager } from "biolqm-io-ts";

const model = await LQMServiceManager.load("model.sbml");
```

Example loading a BoolNet file:

```ts
import { LQMServiceManager } from "biolqm-io-ts";

const model = await LQMServiceManager.load("model.bnet");
```

Example saving a model:

```ts
import { LQMServiceManager } from "biolqm-io-ts";

await LQMServiceManager.save(model, "saved-model.sbml", "sbml");
```

Example saving as BoolNet:

```ts
import { LQMServiceManager } from "biolqm-io-ts";

await LQMServiceManager.save(model, "saved-model.bnet", "bnet");
```

### Notes

- this package depends on `mddlib-ts`
- the main entrypoint is `dist/index.js`
- TypeScript declarations are exposed through `dist/index.d.ts`
- pinning a commit hash is the safest way to keep builds reproducible

## Project Layout

- `src/biolqm/io/sbml/`: ported sbml package
- `src/biolqm/io/bnet/`: ported bnet package
- `src/biolqm/`: minimal supporting `bioLQM` classes
- `src/_jsbml/`: internal JSBML subset required by the sbml package
- `tests/`: translated tests for the supported packages
- `tests/resources/bnet_models/`: bnet fixtures used by the test suite
- `tests/resources/sbml_models/`: sbml fixtures used by the test suite

## Notes

- supported formats currently include `sbml` and `bnet`
- only the tests related to the supported packages from the original project are included
- the internal `_jsbml` layer is intentionally partial
- metadata support is intentionally scoped to what the sbml package and translated tests require

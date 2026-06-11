# bioLQM-io-ts

TypeScript port of the [bioLQM](https://github.com/colomoto/bioLQM) SBML I/O package.

This package currently focuses on `src/main/java/org/colomoto/biolqm/io/sbml` and the minimum additional `bioLQM` and `JSBML` classes required to load and save SBML-qual models.

## Overview

`bioLQM-io-ts` is a focused port of the SBML-qual import/export layer from `bioLQM`.

The scope of this package is intentionally limited:

- `org.colomoto.biolqm.io.sbml`
- the minimum `bioLQM` model and metadata classes needed by that package
- an internal `_jsbml` folder containing the translated subset of JSBML needed by the sbml package
- only the tests related to the sbml package

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

Run the sbml-related Jest suite:

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
import { LQMServiceManager, SBMLFormat } from "biolqm-io-ts";
```

Example loading an SBML-qual file:

```ts
import { LQMServiceManager } from "biolqm-io-ts";

const model = await LQMServiceManager.load("model.sbml");
```

Example saving a model:

```ts
import { LQMServiceManager } from "biolqm-io-ts";

await LQMServiceManager.save(model, "saved-model.sbml", "sbml");
```

### Notes

- this package depends on `mddlib-ts`
- the main entrypoint is `dist/index.js`
- TypeScript declarations are exposed through `dist/index.d.ts`
- pinning a commit hash is the safest way to keep builds reproducible

## Project Layout

- `src/biolqm/io/sbml/`: ported sbml package
- `src/biolqm/`: minimal supporting `bioLQM` classes
- `src/_jsbml/`: internal JSBML subset required by the sbml package
- `tests/`: sbml-related translated tests only
- `tests/resources/sbml_models/`: sbml fixtures used by the test suite

## Java Package Mapping

The original Java package layout maps to the TypeScript source tree as follows.

### `org.colomoto.biolqm.io.sbml`

Available under:

- [src/biolqm/io/sbml/SBMLFormat.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/io/sbml/SBMLFormat.ts:1)
- [src/biolqm/io/sbml/SBMLQualBundle.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/io/sbml/SBMLQualBundle.ts:1)
- [src/biolqm/io/sbml/SBMLqualExport.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/io/sbml/SBMLqualExport.ts:1)
- [src/biolqm/io/sbml/SBMLqualHelper.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/io/sbml/SBMLqualHelper.ts:1)
- [src/biolqm/io/sbml/SBMLqualImport.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/io/sbml/SBMLqualImport.ts:1)

### `org.colomoto.biolqm`

Minimal required support is available under:

- [src/biolqm/LogicalModel.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/LogicalModel.ts:1)
- [src/biolqm/LogicalModelImpl.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/LogicalModelImpl.ts:1)
- [src/biolqm/NodeInfo.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/NodeInfo.ts:1)
- [src/biolqm/ModelLayout.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/ModelLayout.ts:1)
- [src/biolqm/ConnectivityMatrix.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/ConnectivityMatrix.ts:1)

### `org.colomoto.biolqm.io`

Minimal required I/O support is available under:

- [src/biolqm/io/AbstractFormat.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/io/AbstractFormat.ts:1)
- [src/biolqm/io/BaseExporter.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/io/BaseExporter.ts:1)
- [src/biolqm/io/BaseLoader.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/io/BaseLoader.ts:1)
- [src/biolqm/io/LogicalModelFormat.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/io/LogicalModelFormat.ts:1)
- [src/biolqm/io/ModelExporter.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/io/ModelExporter.ts:1)
- [src/biolqm/io/ModelLoader.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/io/ModelLoader.ts:1)
- [src/biolqm/io/StreamProvider.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/io/StreamProvider.ts:1)

### `org.colomoto.biolqm.metadata`

Minimal annotation support is available under:

- [src/biolqm/metadata/AnnotationModule.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/metadata/AnnotationModule.ts:1)
- [src/biolqm/metadata/Annotator.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/metadata/Annotator.ts:1)
- [src/biolqm/metadata/Pair.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/metadata/Pair.ts:1)
- [src/biolqm/metadata/annotations/Annotation.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/metadata/annotations/Annotation.ts:1)
- [src/biolqm/metadata/annotations/Metadata.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/metadata/annotations/Metadata.ts:1)
- [src/biolqm/metadata/annotations/URI.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/metadata/annotations/URI.ts:1)
- [src/biolqm/metadata/constants/Collection.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/metadata/constants/Collection.ts:1)
- [src/biolqm/metadata/constants/Qualifier.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/metadata/constants/Qualifier.ts:1)
- [src/biolqm/metadata/validations/PatternValidator.ts](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/biolqm/metadata/validations/PatternValidator.ts:1)

### `org.sbml.jsbml`

The translated subset used by this package is available internally under:

- [src/_jsbml](/Users/goncalosilva/Documents/MEIC/TESE/bioLQM-js/bioLQM-io-ts/src/_jsbml)

This is not intended as a complete standalone JSBML port. It only contains the classes needed by the current sbml package scope.

## Notes

- only the sbml-related tests from the original project are included
- the internal `_jsbml` layer is intentionally partial
- metadata support is intentionally scoped to what the sbml package and translated tests require

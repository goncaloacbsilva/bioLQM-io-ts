# mddlib-ts

TypeScript port of the Colomoto [mddlib library](https://github.com/colomoto/mddlib), targeting Bun for package management and Jest for tests.

## Overview

`mddlib-ts` mirrors the original Java `mddlib` project as closely as possible while exposing the library as TypeScript modules.

The project includes:

- a TypeScript port of the core MDD manager, variables, operators, comparators, mapper, and path searcher
- a TypeScript port of the logical-function parser package
- a Jest test suite ported from the original Java tests
- Bun-based dependency management and local workflows

## Requirements

- [Bun](https://bun.sh/)
- Node.js is not required for day-to-day usage when running through Bun, but Jest and TypeScript are installed as normal package dependencies

## Setup

Install dependencies:

```bash
bun install
```

This creates the local `node_modules` tree and installs:

- `typescript`
- `jest`
- `ts-jest`
- `@types/jest`

## Build

Compile the library to `dist/`:

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

Run the full Jest suite:

```bash
bun test
```

or equivalently:

```bash
bun run test
```

Watch mode:

```bash
bun run test:watch
```

## Releases

Releases are automated with `release-it` through GitHub Actions.

- Trigger the `Release` workflow manually from GitHub Actions
- Choose the version increment (`patch`, `minor`, `major`, or a prerelease variant)
- The workflow runs tests, builds the package, creates the version commit and tag, pushes them, and creates a GitHub release

Repository setup required:

- keep releases on the `main` branch, since the release configuration requires it

## How To Use

This library is currently intended for internal use.

Since `mddlib-ts` is exclusively used by `bio-LQM`, there is no public package available. The recommended way to consume it from another TypeScript or JavaScript project is to declare it as a Git dependency in that project's `package.json`.

### Add As A Dependency

Example `package.json` entry:

```json
{
  "dependencies": {
    "mddlib-ts": "git+https://github.com/goncaloacbsilva/mddlib-ts.git"
  }
}
```

You can also pin a branch, tag, or commit:

```json
{
  "dependencies": {
    "mddlib-ts": "git+https://github.com/goncaloacbsilva/mddlib-ts.git#main"
  }
}
```

or

```json
{
  "dependencies": {
    "mddlib-ts": "git+https://github.com/goncaloacbsilva/mddlib-ts.git#<commit>"
  }
}
```

### Install In The Parent Project

Using Bun:

```bash
bun install
```

During installation, the library `prepare` script builds the TypeScript sources so the generated `dist/` output is available to the consuming project.

### Import From Your Project

Example:

```ts
import { MDDManagerFactory, PathSearcher } from "mddlib-ts";
```

### Notes

- the package exports `dist/index.js` as its main entrypoint
- TypeScript declarations are exposed through `dist/index.d.ts`
- if you pin a commit hash, the dependency stays fully reproducible
- if you update the dependency reference, rerun `bun install` in the parent project

## Project Layout

- `src/`: TypeScript source for the ported library
- `src/internal/`: storage backend and proxy manager
- `src/operators/`: MDD operators
- `src/logicalfunction/`: logical-function parser and related nodes
- `src/logicalfunction/operators/`: logical-function operator nodes and factories
- `tests/`: Jest test suite ported from the Java project

## Java Package Mapping

The original Java package layout maps to the TypeScript exports as follows.

### `org.colomoto.mddlib`

Exported from [src/index.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/index.ts:1):

- `MDDManager`
- `MDDManagerFactory`
- `MDDVariable`
- `MDDVariableFactory`
- `MDDOperator`
- `MDDComparator`
- `MDDComparatorFactory`
- `MDDMapper`
- `IndexMapper`
- `PathSearcher`
- `NodeRelation`
- `VariableEffect`
- `ParseException`

### `org.colomoto.mddlib.operators`

Available under:

- [src/operators/MDDBaseOperators.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/operators/MDDBaseOperators.ts:1)
- [src/operators/AbstractOperator.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/operators/AbstractOperator.ts:1)
- [src/operators/AbstractFlexibleOperator.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/operators/AbstractFlexibleOperator.ts:1)
- [src/operators/OverwriteOperator.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/operators/OverwriteOperator.ts:1)

### `org.colomoto.mddlib.internal`

Available under:

- [src/internal/MDDStore.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/internal/MDDStore.ts:1)
- [src/internal/MDDStoreImpl.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/internal/MDDStoreImpl.ts:1)
- [src/internal/MDDManagerProxy.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/internal/MDDManagerProxy.ts:1)

### `org.colomoto.mddlib.logicalfunction`

Available under:

- [src/logicalfunction/FunctionNode.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/logicalfunction/FunctionNode.ts:1)
- [src/logicalfunction/AbstractOperand.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/logicalfunction/AbstractOperand.ts:1)
- [src/logicalfunction/FunctionParser.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/logicalfunction/FunctionParser.ts:1)
- [src/logicalfunction/OperandFactory.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/logicalfunction/OperandFactory.ts:1)
- [src/logicalfunction/OperatorCollection.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/logicalfunction/OperatorCollection.ts:1)
- [src/logicalfunction/OperatorFactory.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/logicalfunction/OperatorFactory.ts:1)
- [src/logicalfunction/SimpleOperandFactory.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/logicalfunction/SimpleOperandFactory.ts:1)
- [src/logicalfunction/ValueNode.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/logicalfunction/ValueNode.ts:1)

### `org.colomoto.mddlib.logicalfunction.operators`

Available under:

- [src/logicalfunction/operators/AbstractOperator.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/logicalfunction/operators/AbstractOperator.ts:1)
- [src/logicalfunction/operators/AbstractUnaryOperator.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/logicalfunction/operators/AbstractUnaryOperator.ts:1)
- [src/logicalfunction/operators/AbstractBinaryOperator.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/logicalfunction/operators/AbstractBinaryOperator.ts:1)
- [src/logicalfunction/operators/AndOperatorFactory.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/logicalfunction/operators/AndOperatorFactory.ts:1)
- [src/logicalfunction/operators/OrOperatorFactory.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/logicalfunction/operators/OrOperatorFactory.ts:1)
- [src/logicalfunction/operators/NotOperatorFactory.ts](https://github.com/goncaloacbsilva/mddlib-ts/blob/main/src/logicalfunction/operators/NotOperatorFactory.ts:1)

## Notes

- The Jest suite mirrors the original Java test classes, not auxiliary example programs.
- `NQueens` is included as a direct example port, but not as a Jest test, matching the role it had in the Java project.

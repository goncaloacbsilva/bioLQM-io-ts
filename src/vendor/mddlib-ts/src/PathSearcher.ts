import type { MDDManager } from "./MDDManager";
import { MDDVariable } from "./MDDVariable";

export class PathSearcher implements Iterable<number> {
  private readonly path: number[];
  private readonly max: number[] | null;
  private node = 0;

  private readonly ddmanager: MDDManager;
  private readonly minvalue: number;
  private readonly maxvalue: number;

  constructor(ddmanager: MDDManager);
  constructor(ddmanager: MDDManager, detectIntervals: boolean);
  constructor(ddmanager: MDDManager, value: number);
  constructor(ddmanager: MDDManager, value: number, detectIntervals: boolean);
  constructor(ddmanager: MDDManager, minvalue: number, maxvalue: number);
  constructor(
    ddmanager: MDDManager,
    minvalue: number,
    maxvalue: number,
    detectIntervals: boolean
  );
  constructor(
    ddmanager: MDDManager,
    arg1?: number | boolean,
    arg2?: number | boolean,
    arg3?: boolean
  ) {
    this.ddmanager = ddmanager;
    let minvalue = 0;
    let maxvalue = Number.MAX_SAFE_INTEGER;
    let detectIntervals = false;

    if (typeof arg1 === "boolean") {
      detectIntervals = arg1;
    } else if (typeof arg1 === "number" && typeof arg2 === "boolean") {
      minvalue = arg1;
      maxvalue = arg1;
      detectIntervals = arg2;
    } else if (typeof arg1 === "number" && typeof arg2 === "number") {
      minvalue = arg1;
      maxvalue = arg2;
      detectIntervals = arg3 ?? false;
    } else if (typeof arg1 === "number") {
      minvalue = arg1;
      maxvalue = arg1;
    }

    this.minvalue = minvalue;
    this.maxvalue = maxvalue;
    this.path = new Array<number>(ddmanager.getAllVariables().length);
    this.max = detectIntervals ? new Array<number>(this.path.length) : null;
  }

  setNode(node: number): number[] {
    this.node = node;
    return this.getPath();
  }

  getPath(): number[] {
    return this.path;
  }

  getMax(): number[] {
    if (this.max == null) {
      throw new Error("This path searcher does not support intervals");
    }
    return this.max;
  }

  [Symbol.iterator](): Iterator<number> {
    if (this.ddmanager.isleaf(this.node)) {
      if (this.node >= this.minvalue && this.node <= this.maxvalue) {
        this.path.fill(-1);
        this.max?.fill(-1);
        return new SingleLeafIterator(this.node);
      }
      return EmptyIterator.EMPTYITERATOR;
    }

    if (this.max == null) {
      return new PathFoundIterator(this.ddmanager, this.node, this.path, null, this.minvalue, this.maxvalue);
    }
    return new PathFoundIterator(
      this.ddmanager,
      this.node,
      this.path,
      this.max,
      this.minvalue,
      this.maxvalue
    );
  }

  countPaths(): number {
    let count = 0;
    for (const _i of this) {
      count++;
    }
    return count;
  }
}

class EmptyIterator implements Iterator<number> {
  static readonly EMPTYITERATOR = new EmptyIterator();

  next(): IteratorResult<number> {
    return { done: true, value: undefined as never };
  }
}

class SingleLeafIterator implements Iterator<number> {
  constructor(private leaf: number) {}

  next(): IteratorResult<number> {
    if (this.leaf < 0) {
      return { done: true, value: undefined as never };
    }
    const ret = this.leaf;
    this.leaf = -1;
    return { done: false, value: ret };
  }
}

class PathFoundIterator implements Iterator<number> {
  private readonly backtrack: PathBacktrack;
  private leaf: number;

  constructor(
    ddmanager: MDDManager,
    node: number,
    private readonly path: number[],
    private readonly tmax: number[] | null,
    private readonly minvalue: number,
    private readonly maxvalue: number
  ) {
    this.backtrack = new PathBacktrack(ddmanager);
    this.backtrack.reset(node);
    this.leaf = 0;
    this.leaf = this.getNextLeaf(tmax != null);
  }

  next(): IteratorResult<number> {
    if (this.leaf < 0) {
      return { done: true, value: undefined as never };
    }
    const ret = this.leaf;
    if (this.tmax == null) {
      this.backtrack.fillPath(this.path);
      this.leaf = this.getNextLeaf(false);
    } else {
      this.backtrack.fillPathAndMax(this.path, this.tmax);
      this.leaf = this.getNextLeaf(true);
    }
    return { done: false, value: ret };
  }

  private getNextLeaf(intervals: boolean): number {
    while (this.leaf >= 0) {
      this.leaf = intervals
        ? this.backtrack.findNextLeafMaxVersion()
        : this.backtrack.findNextLeaf();
      if (this.leaf >= this.minvalue && this.leaf <= this.maxvalue) {
        return this.leaf;
      }
    }
    return -1;
  }
}

class PathBacktrack {
  readonly indices: number[];
  readonly values: number[];
  pos = 0;

  constructor(private readonly ddmanager: MDDManager) {
    this.indices = new Array<number>(ddmanager.getAllVariables().length);
    this.values = new Array<number>(this.indices.length);
  }

  reset(node: number): void {
    this.pos = 0;
    this.indices[0] = node;
    this.values[0] = -1;
    for (let i = 1; i < this.indices.length; i++) {
      this.indices[i] = -1;
      this.values[i] = -1;
    }
  }

  fillPath(path: number[]): void {
    path.fill(-1);
    for (let idx = 0; idx <= this.pos; idx++) {
      const variable = this.ddmanager.getNodeVariable(this.indices[idx])!;
      const i = this.ddmanager.getVariableIndex(variable);
      path[i] = this.values[idx];
    }
  }

  fillPathAndMax(path: number[], tmax: number[]): void {
    path.fill(-1);
    tmax.fill(-1);
    for (let idx = 0; idx <= this.pos; idx++) {
      const mdd = this.indices[idx];
      const value = this.values[idx];
      const child = this.ddmanager.getChild(mdd, value);
      const variable = this.ddmanager.getNodeVariable(mdd)!;

      let max = value;
      const absolutemax = variable.nbval - 1;
      while (max < absolutemax) {
        const nextvalue = max + 1;
        if (this.ddmanager.getChild(mdd, nextvalue) !== child) {
          break;
        }
        max = nextvalue;
      }
      if (max > value && max >= absolutemax) {
        max = -1;
      }

      const i = this.ddmanager.getVariableIndex(variable);
      path[i] = this.values[idx];
      tmax[i] = max;
    }
  }

  findNextLeaf(): number {
    if (this.pos < 0) {
      throw new Error("findNext called after exploration is finished");
    }
    const node = this.indices[this.pos];
    if (this.ddmanager.isleaf(node)) {
      throw new Error("findNext went too far");
    }

    const curValue = this.values[this.pos] + 1;
    const variable = this.ddmanager.getNodeVariable(node)!;
    if (curValue < variable.nbval) {
      this.values[this.pos]++;
      const next = this.ddmanager.getChild(node, curValue);
      if (this.ddmanager.isleaf(next)) {
        return next;
      }
      this.pos++;
      this.indices[this.pos] = next;
      this.values[this.pos] = -1;
    } else {
      this.pos--;
      if (this.pos < 0) {
        return -1;
      }
    }
    return this.findNextLeaf();
  }

  findNextLeafMaxVersion(): number {
    if (this.pos < 0) {
      throw new Error("findNext called after exploration is finished");
    }
    const node = this.indices[this.pos];
    if (this.ddmanager.isleaf(node)) {
      throw new Error("findNext went too far");
    }

    let curValue = this.values[this.pos];
    const variable = this.ddmanager.getNodeVariable(node)!;
    if (curValue >= 0) {
      const child = this.ddmanager.getChild(node, curValue);
      for (curValue++; curValue < variable.nbval; curValue++) {
        const curChild = this.ddmanager.getChild(node, curValue);
        if (curChild !== child) {
          break;
        }
      }
    } else {
      curValue++;
    }

    if (curValue < variable.nbval) {
      this.values[this.pos] = curValue;
      const next = this.ddmanager.getChild(node, curValue);
      if (this.ddmanager.isleaf(next)) {
        return next;
      }
      this.pos++;
      this.indices[this.pos] = next;
      this.values[this.pos] = -1;
    } else {
      this.pos--;
      if (this.pos < 0) {
        return -1;
      }
    }
    return this.findNextLeafMaxVersion();
  }
}

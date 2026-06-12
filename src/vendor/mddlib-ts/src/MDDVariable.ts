import type { MDDStore } from "./internal/MDDStore";

export class MDDVariable {
  readonly key: unknown;
  readonly nbval: number;
  readonly order: number;
  private readonly store: MDDStore;

  constructor(store: MDDStore, order: number, key: unknown, nbval: number) {
    this.store = store;
    this.order = order;
    this.key = key;
    this.nbval = nbval;
  }

  getNodeForValue(v: number, value: number): number {
    if (v < 0 || v >= this.nbval) {
      return 1;
    }

    if (this.nbval === 2) {
      if (v === 0) {
        return this.getNode(value, 0);
      }
      return this.getNode(0, value);
    }

    const children = new Array<number>(this.nbval).fill(0);
    children[v] = value;
    return this.getNode(children);
  }

  getNode(f: number, t: number): number;
  getNode(children: number[]): number;
  getNode(arg1: number | number[], arg2?: number): number {
    if (Array.isArray(arg1)) {
      const children = arg1;
      if (this.nbval !== children.length) {
        throw new Error(`MDD: nbval mismatch (${this.nbval} vs ${children.length})`);
      }
      return this.store.getNode(this.order, children);
    }

    if (this.nbval !== 2) {
      throw new Error(`MDD: not a Boolean variable (nbval=${this.nbval})`);
    }
    return this.store.getNode(this.order, arg1, arg2 as number);
  }

  getNodeFree(f: number, t: number): number;
  getNodeFree(children: number[]): number;
  getNodeFree(arg1: number | number[], arg2?: number): number {
    const ret = Array.isArray(arg1) ? this.getNode(arg1) : this.getNode(arg1, arg2 as number);
    if (Array.isArray(arg1)) {
      for (const node of arg1) {
        this.store.free(node);
      }
    } else {
      this.store.free(arg1);
      this.store.free(arg2 as number);
    }
    return ret;
  }

  getSimpleNode(vfalse: number, vtrue: number, start: number, end: number): number {
    if (start > end || start < 0) {
      return -1;
    }
    if (end >= this.nbval) {
      end = this.nbval - 1;
    }
    if (this.nbval === 2) {
      if (start !== end) {
        return vtrue;
      }
      if (start === 0) {
        return this.store.getNode(this.order, vtrue, vfalse);
      }
      return this.store.getNode(this.order, vfalse, vtrue);
    }

    const children = new Array<number>(this.nbval);
    for (let i = 0; i < start; i++) {
      children[i] = vfalse;
    }
    for (let i = start; i <= end; i++) {
      children[i] = vtrue;
    }
    for (let i = end + 1; i < this.nbval; i++) {
      children[i] = vfalse;
    }
    return this.store.getNode(this.order, children);
  }

  equals(other: unknown): boolean {
    if (other instanceof MDDVariable) {
      return this.key === other.key && this.nbval === other.nbval;
    }
    return this.key === other;
  }

  after(other: MDDVariable | null): boolean {
    if (other == null) {
      return false;
    }
    return other.order < this.order;
  }

  static selectFirstVariable(v1: MDDVariable | null, v2: MDDVariable | null): MDDVariable | null {
    if (v1 == null || v1.after(v2)) {
      return v2;
    }
    return v1;
  }

  toString(): string {
    return String(this.key);
  }
}

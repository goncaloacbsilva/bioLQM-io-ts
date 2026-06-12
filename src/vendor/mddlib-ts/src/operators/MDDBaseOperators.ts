import type { MDDManager } from "../MDDManager";
import { NodeRelation } from "../NodeRelation";
import { MDDVariable } from "../MDDVariable";
import { AbstractOperator } from "./AbstractOperator";

class MDDAndOperator extends AbstractOperator {
  constructor() {
    super(true);
  }

  protected combinePair(ddmanager: MDDManager, first: number, other: number): number {
    if (first === other) {
      return ddmanager.use(first);
    }
    const status = ddmanager.getRelation(first, other);
    switch (status) {
      case NodeRelation.LN:
      case NodeRelation.LL:
        if (first < 1) {
          return first;
        }
        return ddmanager.use(other);
      case NodeRelation.NL:
        if (other < 1) {
          return other;
        }
        return ddmanager.use(first);
      default:
        return this.recurse(ddmanager, status, first, other);
    }
  }

  protected recurse_multiple(
    ddmanager: MDDManager,
    nodes: number[],
    leafcount: number,
    minVar: MDDVariable
  ): number {
    for (let i = 0; i < leafcount; i++) {
      if (nodes[i] <= 0) {
        return 0;
      }
    }
    nodes = AbstractOperator.prune_start(nodes, leafcount);
    return super.recurse_multiple(ddmanager, nodes, 0, minVar);
  }

  protected multiple_leaves(_ddmanager: MDDManager, leaves: number[]): number {
    for (const leaf of leaves) {
      if (leaf < 1) {
        return leaf;
      }
    }
    return leaves[0];
  }
}

class MDDOrOperator extends AbstractOperator {
  constructor() {
    super(true);
  }

  protected combinePair(ddmanager: MDDManager, first: number, other: number): number {
    if (first === other) {
      return ddmanager.use(first);
    }
    const status = ddmanager.getRelation(first, other);
    switch (status) {
      case NodeRelation.LN:
      case NodeRelation.LL:
        if (first > 0) {
          return first;
        }
        return ddmanager.use(other);
      case NodeRelation.NL:
        if (other > 0) {
          return other;
        }
        return ddmanager.use(first);
      default:
        return this.recurse(ddmanager, status, first, other);
    }
  }

  protected recurse_multiple(
    ddmanager: MDDManager,
    nodes: number[],
    leafcount: number,
    minVar: MDDVariable
  ): number {
    for (let i = 0; i < leafcount; i++) {
      if (nodes[i] > 0) {
        return 1;
      }
    }
    nodes = AbstractOperator.prune_start(nodes, leafcount);
    return super.recurse_multiple(ddmanager, nodes, 0, minVar);
  }

  protected multiple_leaves(_ddmanager: MDDManager, leaves: number[]): number {
    for (const leaf of leaves) {
      if (leaf > 0) {
        return leaf;
      }
    }
    return leaves[0];
  }
}

class MDDOverloadOperator extends AbstractOperator {
  protected combinePair(ddmanager: MDDManager, first: number, other: number): number {
    if (first === other) {
      return ddmanager.use(first);
    }
    const status = ddmanager.getRelation(first, other);
    switch (status) {
      case NodeRelation.NL:
      case NodeRelation.LL:
        if (other > 0) {
          return other;
        }
        return ddmanager.use(first);
      default:
        return this.recurse(ddmanager, status, first, other);
    }
  }
}

class MDDOverloadCustomOperator extends AbstractOperator {
  constructor(private readonly overValue: number) {
    super(false);
  }

  protected combinePair(ddmanager: MDDManager, first: number, other: number): number {
    if (first === other) {
      return ddmanager.use(first);
    }
    const status = ddmanager.getRelation(first, other);
    switch (status) {
      case NodeRelation.NL:
      case NodeRelation.LL:
        if (other > 0) {
          return this.overValue;
        }
        return ddmanager.use(first);
      default:
        return this.recurse(ddmanager, status, first, other);
    }
  }
}

const overv = new Array<MDDOverloadCustomOperator>(10);
for (let v = 0; v < 10; v++) {
  overv[v] = new MDDOverloadCustomOperator(v);
}

export class MDDBaseOperators {
  static readonly AND = new MDDAndOperator();
  static readonly OR = new MDDOrOperator();
  static readonly OVER = new MDDOverloadOperator();
  static readonly OVERV = overv;

  static OVEROPERATOR(v: number): MDDOverloadCustomOperator {
    return MDDBaseOperators.OVERV[v];
  }
}

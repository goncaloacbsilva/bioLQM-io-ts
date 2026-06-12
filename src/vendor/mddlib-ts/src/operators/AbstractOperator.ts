import type { MDDManager } from "../MDDManager";
import type { MDDOperator } from "../MDDOperator";
import { MDDVariable } from "../MDDVariable";
import { NodeRelation } from "../NodeRelation";

export abstract class AbstractOperator implements MDDOperator {
  constructor(private readonly multipleMerge = false) {}

  recurse(
    ddmanager: MDDManager,
    status: NodeRelation,
    first: number,
    other: number
  ): number {
    switch (status) {
      case NodeRelation.LN:
      case NodeRelation.NNf: {
        const variable = ddmanager.getNodeVariable(other)!;
        if (variable.nbval === 2) {
          const l = this.combine(ddmanager, first, ddmanager.getChild(other, 0));
          const r = this.combine(ddmanager, first, ddmanager.getChild(other, 1));
          return variable.getNodeFree(l, r);
        }
        const children = new Array<number>(variable.nbval);
        for (let i = 0; i < children.length; i++) {
          children[i] = this.combine(ddmanager, first, ddmanager.getChild(other, i));
        }
        return variable.getNodeFree(children);
      }
      case NodeRelation.NL:
      case NodeRelation.NNn: {
        const variable = ddmanager.getNodeVariable(first)!;
        if (variable.nbval === 2) {
          const l = this.combine(ddmanager, ddmanager.getChild(first, 0), other);
          const r = this.combine(ddmanager, ddmanager.getChild(first, 1), other);
          return variable.getNodeFree(l, r);
        }
        const children = new Array<number>(variable.nbval);
        for (let i = 0; i < children.length; i++) {
          children[i] = this.combine(ddmanager, ddmanager.getChild(first, i), other);
        }
        return variable.getNodeFree(children);
      }
      case NodeRelation.NN: {
        const variable = ddmanager.getNodeVariable(first)!;
        if (variable.nbval === 2) {
          const l = this.combine(
            ddmanager,
            ddmanager.getChild(first, 0),
            ddmanager.getChild(other, 0)
          );
          const r = this.combine(
            ddmanager,
            ddmanager.getChild(first, 1),
            ddmanager.getChild(other, 1)
          );
          return variable.getNodeFree(l, r);
        }
        const children = new Array<number>(variable.nbval);
        for (let i = 0; i < children.length; i++) {
          children[i] = this.combine(
            ddmanager,
            ddmanager.getChild(first, i),
            ddmanager.getChild(other, i)
          );
        }
        return variable.getNodeFree(children);
      }
      default:
        return -1;
    }
  }

  combine(ddmanager: MDDManager, first: number, other: number): number;
  combine(ddmanager: MDDManager, nodes: number[]): number;
  combine(
    ddmanager: MDDManager,
    firstOrNodes: number | number[],
    other?: number
  ): number {
    if (Array.isArray(firstOrNodes)) {
      const nodes = firstOrNodes;
      switch (nodes.length) {
        case 0:
          throw new Error("Need at least one node to merge");
        case 1:
          return ddmanager.use(nodes[0]);
        case 2:
          return this.combine(ddmanager, nodes[0], nodes[1]);
        default:
          break;
      }

      let result = nodes[0];
      if (this.multipleMerge) {
        return this.combineMultiple(ddmanager, nodes.slice(), 0);
      }

      let oldresult = 0;
      for (let i = 1; i < nodes.length; i++) {
        ddmanager.free(oldresult);
        result = this.combine(ddmanager, result, nodes[i]);
        oldresult = result;
      }
      return result;
    }

    return this.combinePair(ddmanager, firstOrNodes, other as number);
  }

  protected abstract combinePair(
    ddmanager: MDDManager,
    first: number,
    other: number
  ): number;

  protected multiple_leaves(ddmanager: MDDManager, leaves: number[]): number {
    if (leaves.length < 1) {
      throw new Error("Need at least one node to merge");
    }

    let result = leaves[0];
    let oldresult = 0;
    for (let i = 1; i < leaves.length; i++) {
      ddmanager.free(oldresult);
      result = this.combine(ddmanager, result, leaves[i]);
      oldresult = result;
    }
    return result;
  }

  private combineMultiple(ddmanager: MDDManager, nodes: number[], leafcount: number): number {
    let bestVar: MDDVariable | null = null;
    for (let i = leafcount; i < nodes.length; i++) {
      const id = nodes[i];
      if (ddmanager.isleaf(id)) {
        nodes[i] = nodes[leafcount];
        nodes[leafcount] = id;
        leafcount++;
      } else {
        const variable = ddmanager.getNodeVariable(id)!;
        bestVar = MDDVariable.selectFirstVariable(bestVar, variable);
      }
    }

    if (leafcount === nodes.length) {
      return this.multiple_leaves(ddmanager, nodes);
    }
    return this.recurse_multiple(ddmanager, nodes, leafcount, bestVar!);
  }

  static prune_start(nodes: number[], skip: number): number[] {
    if (skip < 1) {
      return nodes;
    }
    return nodes.slice(skip);
  }

  protected recurse_multiple(
    ddmanager: MDDManager,
    nodes: number[],
    leafcount: number,
    bestVar: MDDVariable
  ): number {
    if (bestVar.nbval === 2) {
      const lnodes = new Array<number>(nodes.length);
      const rnodes = new Array<number>(nodes.length);
      for (let i = 0; i < leafcount; i++) {
        lnodes[i] = nodes[i];
        rnodes[i] = nodes[i];
      }
      for (let i = leafcount; i < nodes.length; i++) {
        const node = nodes[i];
        if (ddmanager.getNodeVariable(node) === bestVar) {
          lnodes[i] = ddmanager.getChild(node, 0);
          rnodes[i] = ddmanager.getChild(node, 1);
        } else {
          lnodes[i] = node;
          rnodes[i] = node;
        }
      }
      const lchild = this.combineMultiple(ddmanager, lnodes, leafcount);
      const rchild = this.combineMultiple(ddmanager, rnodes, leafcount);
      return bestVar.getNodeFree(lchild, rchild);
    }

    const children = new Array<number>(bestVar.nbval);
    const nextnodes = new Array<number>(nodes.length);
    for (let v = 0; v < children.length; v++) {
      for (let i = 0; i < leafcount; i++) {
        nextnodes[i] = nodes[i];
      }
      for (let i = leafcount; i < nodes.length; i++) {
        const node = nodes[i];
        if (ddmanager.getNodeVariable(node) === bestVar) {
          nextnodes[i] = ddmanager.getChild(node, v);
        } else {
          nextnodes[i] = nodes[i];
        }
      }
      children[v] = this.combineMultiple(ddmanager, nextnodes.slice(), leafcount);
    }
    return bestVar.getNodeFree(children);
  }
}

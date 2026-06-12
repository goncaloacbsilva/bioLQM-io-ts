import type { MDDManager } from "../MDDManager";
import type { FunctionNode } from "./FunctionNode";

export class ValueNode implements FunctionNode {
  static readonly TRUE = new ValueNode(1);
  static readonly FALSE = new ValueNode(0);

  private static readonly NBVALUES = 10;
  private static readonly VALUES = (() => {
    const values = new Array<ValueNode>(ValueNode.NBVALUES);
    for (let i = 0; i < ValueNode.NBVALUES; i++) {
      values[i] = new ValueNode(1);
    }
    return values;
  })();

  static getNode(value: number): ValueNode {
    if (value < 0) {
      throw new Error("Value must be positive");
    }

    if (value < ValueNode.NBVALUES) {
      return ValueNode.VALUES[value];
    }
    return new ValueNode(value);
  }

  private constructor(private readonly value: number) {}

  toString(_par: boolean): string {
    return `${this.value}`;
  }

  isLeaf(): boolean {
    return true;
  }

  getMDD(_ddmanager: MDDManager): number {
    return this.value;
  }
}

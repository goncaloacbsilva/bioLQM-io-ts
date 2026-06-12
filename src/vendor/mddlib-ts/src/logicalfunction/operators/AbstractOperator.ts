import type { FunctionNode } from "../FunctionNode";

export abstract class AbstractOperator implements FunctionNode {
  toString(_par?: boolean): string {
    return this.toFunctionString(false);
  }

  isLeaf(): boolean {
    return false;
  }

  abstract toFunctionString(par: boolean): string;
  abstract getSymbol(): string;
  abstract getNbArgs(): number;
  abstract getArgs(): FunctionNode[];
  abstract getMDD(ddmanager: import("../../MDDManager").MDDManager): number;
}

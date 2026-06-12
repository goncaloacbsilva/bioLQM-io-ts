import type { FunctionNode } from "../FunctionNode";
import { AbstractOperator } from "./AbstractOperator";

export abstract class AbstractUnaryOperator extends AbstractOperator {
  protected readonly arg: FunctionNode;

  constructor(argOrStack: FunctionNode[] | FunctionNode) {
    super();
    this.arg = Array.isArray(argOrStack) ? argOrStack.pop()! : argOrStack;
  }

  toFunctionString(_par: boolean): string {
    return this.getSymbol() + this.arg.toString(true);
  }

  getNbArgs(): number {
    return 1;
  }

  getArgs(): FunctionNode[] {
    return [this.arg];
  }
}

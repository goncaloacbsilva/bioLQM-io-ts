import type { MDDManager } from "../../MDDManager";
import type { FunctionNode } from "../FunctionNode";
import type { OperatorFactory } from "../OperatorFactory";
import { AbstractUnaryOperator } from "./AbstractUnaryOperator";

export class NotOperatorFactory implements OperatorFactory {
  static readonly FACTORY = new NotOperatorFactory();
  static readonly PRIORITY = 2;
  static readonly SYMBOL = "!";

  private constructor() {}

  getSymbol(): string {
    return NotOperatorFactory.SYMBOL;
  }

  getPriority(): number {
    return NotOperatorFactory.PRIORITY;
  }

  getNode(stack: FunctionNode[]): FunctionNode {
    return new NotOperator(stack);
  }

  getNodeFromArg(n: FunctionNode): FunctionNode {
    return new NotOperator(n);
  }
}

class NotOperator extends AbstractUnaryOperator {
  getSymbol(): string {
    return NotOperatorFactory.SYMBOL;
  }

  getMDD(ddmanager: MDDManager): number {
    const mdd = this.arg.getMDD(ddmanager);
    const ret = ddmanager.not(mdd);
    ddmanager.free(mdd);
    return ret;
  }
}

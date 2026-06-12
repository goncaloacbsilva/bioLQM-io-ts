import type { MDDOperator } from "../../MDDOperator";
import type { FunctionNode } from "../FunctionNode";
import type { OperatorFactory } from "../OperatorFactory";
import { MDDBaseOperators } from "../../operators/MDDBaseOperators";
import { AbstractBinaryOperator } from "./AbstractBinaryOperator";

export class AndOperatorFactory implements OperatorFactory {
  static readonly FACTORY = new AndOperatorFactory();
  static readonly PRIORITY = 1;
  static readonly SYMBOL = "&";

  private constructor() {}

  getSymbol(): string {
    return AndOperatorFactory.SYMBOL;
  }

  getPriority(): number {
    return AndOperatorFactory.PRIORITY;
  }

  getNode(stack: FunctionNode[]): FunctionNode {
    return new AndOperator(stack);
  }

  getNodeFromArgs(n1: FunctionNode, n2: FunctionNode): FunctionNode {
    return new AndOperator(n1, n2);
  }
}

class AndOperator extends AbstractBinaryOperator {
  getSymbol(): string {
    return AndOperatorFactory.SYMBOL;
  }

  protected getMDDOperation(): MDDOperator {
    return MDDBaseOperators.AND;
  }
}

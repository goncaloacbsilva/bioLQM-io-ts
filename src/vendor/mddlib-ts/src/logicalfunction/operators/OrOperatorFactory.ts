import type { MDDOperator } from "../../MDDOperator";
import type { FunctionNode } from "../FunctionNode";
import type { OperatorFactory } from "../OperatorFactory";
import { MDDBaseOperators } from "../../operators/MDDBaseOperators";
import { AbstractBinaryOperator } from "./AbstractBinaryOperator";

export class OrOperatorFactory implements OperatorFactory {
  static readonly FACTORY = new OrOperatorFactory();
  static readonly PRIORITY = 0;
  static readonly SYMBOL = "|";

  private constructor() {}

  getSymbol(): string {
    return OrOperatorFactory.SYMBOL;
  }

  getPriority(): number {
    return OrOperatorFactory.PRIORITY;
  }

  getNode(stack: FunctionNode[]): FunctionNode {
    return new OrOperator(stack);
  }

  getNodeFromArgs(n1: FunctionNode, n2: FunctionNode): FunctionNode {
    return new OrOperator(n1, n2);
  }
}

class OrOperator extends AbstractBinaryOperator {
  getSymbol(): string {
    return OrOperatorFactory.SYMBOL;
  }

  protected getMDDOperation(): MDDOperator {
    return MDDBaseOperators.OR;
  }
}

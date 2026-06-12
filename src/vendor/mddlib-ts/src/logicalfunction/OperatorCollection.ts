import type { FunctionNode } from "./FunctionNode";
import type { OperatorFactory } from "./OperatorFactory";
import { AndOperatorFactory } from "./operators/AndOperatorFactory";
import { NotOperatorFactory } from "./operators/NotOperatorFactory";
import { OrOperatorFactory } from "./operators/OrOperatorFactory";

export class OperatorCollection {
  static readonly DEFAULT_OPERATORS = (() => {
    const operators = new OperatorCollection();
    operators.addFactory(AndOperatorFactory.FACTORY);
    operators.addFactory(OrOperatorFactory.FACTORY);
    operators.addFactory(NotOperatorFactory.FACTORY);
    return operators;
  })();

  private operatorList: string[] | null = null;
  private operatorsAndParenthesis: string | null = null;
  private readonly factories = new Map<string, OperatorFactory>();

  createOperator(value: string, stack: FunctionNode[]): FunctionNode {
    const factory = this.factories.get(value);
    if (factory == null) {
      throw new Error(`invalid operator: ${value}`);
    }
    return factory.getNode(stack);
  }

  getPriority(value: string): number {
    return this.factories.get(value)?.getPriority() ?? -1;
  }

  getOperators(): string[] {
    if (this.operatorList == null) {
      this.operatorList = [];
      for (const factory of this.factories.values()) {
        this.operatorList.push(factory.getSymbol());
      }
      this.operatorList.push("(");
      this.operatorList.push(")");
    }
    return this.operatorList;
  }

  getRegex(): string {
    if (this.operatorsAndParenthesis == null) {
      let buffer = "";
      for (const factory of this.factories.values()) {
        buffer += `\\${factory.getSymbol()}|`;
      }
      buffer += "\\(|\\)| ";
      this.operatorsAndParenthesis = buffer;
    }
    return this.operatorsAndParenthesis;
  }

  addFactory(factory: OperatorFactory): void {
    this.factories.set(factory.getSymbol(), factory);
    this.operatorList = null;
    this.operatorsAndParenthesis = null;
  }
}

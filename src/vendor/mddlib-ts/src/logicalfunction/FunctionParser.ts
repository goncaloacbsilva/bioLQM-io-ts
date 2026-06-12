import type { FunctionNode } from "./FunctionNode";
import type { OperandFactory } from "./OperandFactory";
import { OperatorCollection } from "./OperatorCollection";

export class FunctionParser {
  readonly operatorCollection: OperatorCollection;
  readonly operatorsAndParenthesis: string;
  readonly operators: string[];

  constructor(operatorCollection = OperatorCollection.DEFAULT_OPERATORS) {
    this.operatorCollection = operatorCollection;
    this.operatorsAndParenthesis = operatorCollection.getRegex();
    this.operators = operatorCollection.getOperators();
  }

  compile(opFactory: OperandFactory, s: string): FunctionNode | null {
    let i: number;
    let j: number;
    let k: number;
    let elem: string | null;
    const split = s.split(new RegExp(this.operatorsAndParenthesis));
    const operands: string[] = [];

    for (i = 0; i < split.length; i++) {
      if (split[i] !== "") {
        operands.push(split[i]);
      }
    }
    if (!opFactory.verifOperandList(operands)) {
      return null;
    }

    i = 0;
    const operandStack: FunctionNode[] = [];
    const operatorStack: string[] = [];
    while (i !== s.length) {
      elem = this.readElement(this.operators, operands, s, i);
      if (elem == null) {
        return null;
      } else if (operands.includes(elem)) {
        try {
          const operand = opFactory.createOperand(elem);
          if (operand == null) {
            return null;
          }
          operandStack.push(operand);
        } catch {
          return null;
        }
      } else if (elem === "(") {
        operatorStack.push(elem);
      } else if (elem === ")") {
        while (operatorStack[operatorStack.length - 1] !== "(") {
          const node = this.operatorCollection.createOperator(operatorStack.pop()!, operandStack);
          if (node != null) {
            operandStack.push(node);
          }
        }
        operatorStack.pop();
      } else if (this.operators.includes(elem)) {
        j = this.operatorCollection.getPriority(elem);
        while (operatorStack.length > 0) {
          k = this.operatorCollection.getPriority(operatorStack[operatorStack.length - 1]);
          if (k < j) {
            break;
          }
          const node = this.operatorCollection.createOperator(operatorStack.pop()!, operandStack);
          if (node != null) {
            operandStack.push(node);
          }
        }
        operatorStack.push(elem);
      }
      i = elem.length + s.indexOf(elem, i);
    }

    while (operatorStack.length > 0) {
      const node = this.operatorCollection.createOperator(operatorStack.pop()!, operandStack);
      if (node != null) {
        operandStack.push(node);
      } else {
        return null;
      }
    }

    const root = operandStack.pop() ?? null;
    if (operandStack.length > 0) {
      return null;
    }
    return root;
  }

  private readElement(
    operators: string[],
    operands: string[],
    s: string,
    i: number
  ): string | null {
    const s2 = s.substring(i).trim();
    let ret = "";

    for (const tmp of operands) {
      if (s2.startsWith(tmp) && tmp.length > ret.length) {
        ret = tmp;
      }
    }
    if (ret === "") {
      for (const tmp of operators) {
        if (s2.startsWith(tmp)) {
          ret = tmp;
          break;
        }
      }
    }
    if (ret === "") {
      return null;
    }
    return ret;
  }
}

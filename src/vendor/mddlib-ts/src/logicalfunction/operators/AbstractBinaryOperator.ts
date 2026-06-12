import type { MDDManager } from "../../MDDManager";
import type { MDDOperator } from "../../MDDOperator";
import type { FunctionNode } from "../FunctionNode";
import { AbstractOperator } from "./AbstractOperator";

export abstract class AbstractBinaryOperator extends AbstractOperator {
  protected readonly leftArg: FunctionNode;
  protected readonly rightArg: FunctionNode;

  constructor(leftArgOrStack: FunctionNode[] | FunctionNode, rightArg?: FunctionNode) {
    super();
    if (Array.isArray(leftArgOrStack)) {
      this.rightArg = leftArgOrStack.pop()!;
      this.leftArg = leftArgOrStack.pop()!;
    } else {
      this.leftArg = leftArgOrStack;
      this.rightArg = rightArg!;
    }
    if (this.leftArg == null || this.rightArg == null) {
      throw new Error("Wrong args?");
    }
  }

  toFunctionString(par: boolean): string {
    let leftPar = true;
    if (this.leftArg.isLeaf()) {
      leftPar = false;
    } else if ((this.leftArg as AbstractOperator).getSymbol() === this.getSymbol()) {
      leftPar = false;
    }
    let rightPar = true;
    if (this.rightArg.isLeaf()) {
      rightPar = false;
    } else if ((this.rightArg as AbstractOperator).getSymbol() === this.getSymbol()) {
      rightPar = false;
    }
    let s =
      this.leftArg.toString(leftPar) +
      " " +
      this.getSymbol() +
      " " +
      this.rightArg.toString(rightPar);
    if (par) {
      s = `(${s})`;
    }
    return s;
  }

  getNbArgs(): number {
    return 2;
  }

  getArgs(): FunctionNode[] {
    return [this.leftArg, this.rightArg];
  }

  getMDD(ddmanager: MDDManager): number {
    const l = this.leftArg.getMDD(ddmanager);
    const r = this.rightArg.getMDD(ddmanager);
    const ret = this.getMDDOperation().combine(ddmanager, l, r);
    ddmanager.free(l);
    ddmanager.free(r);
    return ret;
  }

  protected abstract getMDDOperation(): MDDOperator;
}

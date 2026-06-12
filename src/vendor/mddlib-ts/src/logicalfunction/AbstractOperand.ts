import type { MDDManager } from "../MDDManager";
import type { FunctionNode } from "./FunctionNode";

export abstract class AbstractOperand implements FunctionNode {
  isLeaf(): boolean {
    return true;
  }

  toString(_par?: boolean): string {
    return this.toOperandString(false);
  }

  abstract toOperandString(par: boolean): string;
  abstract getMDDVariableKey(): unknown;

  getRangeStart(): number {
    return 1;
  }

  getRangeEnd(): number {
    return 1;
  }

  getMDD(ddmanager: MDDManager): number {
    const variable = ddmanager.getVariableForKey(this.getMDDVariableKey())!;
    return variable.getSimpleNode(0, 1, this.getRangeStart(), this.getRangeEnd());
  }
}

import type { MDDManager } from "../MDDManager";
import { MDDManagerFactory } from "../MDDManagerFactory";
import { AbstractOperand } from "./AbstractOperand";
import type { OperandFactory } from "./OperandFactory";

export class SimpleOperandFactory<T> implements OperandFactory {
  private readonly operandMap = new Map<string, SimpleOperand<T>>();
  private readonly operands: T[];
  private ddmanager: MDDManager | null = null;

  constructor(operands: T[]) {
    this.operands = operands;
    let i = 0;
    for (const obj of operands) {
      const operand = new SimpleOperand(obj, i);
      i++;
      this.operandMap.set(operand.toOperandString(false), operand);
    }
  }

  verifOperandList(_list: string[]): boolean {
    return true;
  }

  createOperand(name: string): AbstractOperand | null;
  createOperand(name: string, threshold: number): AbstractOperand | null;
  createOperand(name: string, threshold?: number): AbstractOperand | null {
    if (threshold == null) {
      return this.operandMap.get(name) ?? null;
    }

    if (threshold < 1 || threshold > 100) {
      return null;
    }

    const operand = this.operandMap.get(name);
    if (threshold === 1 || operand == null) {
      return operand ?? null;
    }

    const key = `${name}@${threshold}`;
    let thresholdOperand = this.operandMap.get(key);
    if (thresholdOperand == null) {
      thresholdOperand = new SimpleOperand(operand.object, operand.variable, threshold);
      this.operandMap.set(key, thresholdOperand);
    }
    return thresholdOperand;
  }

  getMDDManager(): MDDManager {
    if (this.ddmanager == null) {
      this.ddmanager = MDDManagerFactory.getManager(this.operands, 2);
    }
    return this.ddmanager;
  }
}

class SimpleOperand<T> extends AbstractOperand {
  constructor(
    readonly object: T,
    readonly variable: number,
    readonly threshold = 1
  ) {
    super();
  }

  toOperandString(_par: boolean): string {
    let s = String(this.object);
    if (this.threshold !== 1) {
      s += `@${this.threshold}`;
    }
    return s;
  }

  getMDDVariableKey(): T {
    return this.object;
  }

  getRangeStart(): number {
    return this.threshold;
  }

  getRangeEnd(): number {
    return 127;
  }
}

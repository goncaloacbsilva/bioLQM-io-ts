import type { MDDManager } from "../MDDManager";
import type { FunctionNode } from "./FunctionNode";

export interface OperandFactory {
  getMDDManager(): MDDManager;
  verifOperandList(list: string[]): boolean;
  createOperand(name: string): FunctionNode | null;
  createOperand(name: string, threshold: number): FunctionNode | null;
}

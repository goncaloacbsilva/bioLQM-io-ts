import type { FunctionNode } from "./FunctionNode";

export interface OperatorFactory {
  getSymbol(): string;
  getPriority(): number;
  getNode(stack: FunctionNode[]): FunctionNode;
}

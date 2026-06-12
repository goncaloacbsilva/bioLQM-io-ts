import type { MDDManager } from "../MDDManager";

export interface FunctionNode {
  toString(par: boolean): string;
  isLeaf(): boolean;
  getMDD(ddmanager: MDDManager): number;
}

import type { MDDManager } from "./MDDManager";

export interface MDDOperator {
  combine(ddmanager: MDDManager, first: number, other: number): number;
  combine(ddmanager: MDDManager, nodes: number[]): number;
}

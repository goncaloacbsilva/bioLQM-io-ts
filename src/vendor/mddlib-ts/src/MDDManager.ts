import type { ParseException } from "./errors";
import type { MDDVariable } from "./MDDVariable";
import type { NodeRelation } from "./NodeRelation";
import type { VariableEffect } from "./VariableEffect";

export interface MDDManager {
  getManager(order: unknown[]): MDDManager;
  getNodeVariable(n: number): MDDVariable | null;
  getVariableForKey(key: unknown): MDDVariable | null;
  getVariableIndex(variable: MDDVariable): number;
  getAllVariables(): MDDVariable[];
  ensureVariable(key: unknown, nbval: number): MDDVariable;
  free(pos: number): void;
  use(node: number): number;
  isleaf(node: number): boolean;
  getChild(node: number, value: number): number;
  getChildren(node: number): number[] | null;
  not(node: number): number;
  mnot(node: number, value: number): number;
  getRelation(first: number, other: number): NodeRelation;
  getNodeCount(): number;
  getLeafCount(): number;
  getSign(node: number, pivot: MDDVariable): number;
  reach(node: number, values: number[]): number;
  groupReach(node: number, path: number[]): number;
  collectDecisionVariables(node: number): boolean[];
  getVariableEffect(variable: MDDVariable, node: number): VariableEffect;
  getMultivaluedVariableEffect(
    variable: MDDVariable,
    node: number
  ): VariableEffect[];
  isView(ddm: MDDManager): boolean;
  nodeFromState(state: number[], value: number): number;
  nodeFromStates(states: Iterable<number[]>, value: number): number;
  dumpMDD(node: number): string;
  parseDump(s: string): number;
}

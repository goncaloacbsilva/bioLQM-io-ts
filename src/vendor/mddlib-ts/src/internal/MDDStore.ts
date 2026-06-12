import type { MDDManager } from "../MDDManager";

export interface MDDStore extends MDDManager {
  getNode(variable: number, leftChild: number, rightChild: number): number;
  getNode(variable: number, children: number[]): number;
  reach(node: number, values: number[]): number;
  reach(node: number, values: number[], orderMap: number[]): number;
  groupReach(node: number, values: number[]): number;
  groupReach(node: number, values: number[], orderMap: number[]): number;
  nodeFromState(state: number[], value: number): number;
  nodeFromState(state: number[], value: number, orderMap: number[]): number;
}

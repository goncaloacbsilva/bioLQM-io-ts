import type { MDDManager } from "mddlib-ts";
import { Annotator } from "./metadata/Annotator";
import { ModelLayout } from "./ModelLayout";
import { NodeInfo } from "./NodeInfo";

export interface LogicalModel {
  getMDDManager(): MDDManager;
  getComponents(): NodeInfo[];
  getLogicalFunctions(): number[];
  getExtraComponents(): NodeInfo[];
  getExtraLogicalFunctions(): number[];
  getTargetValue(componentIdx: number, state: number[]): number;
  hasExtraComponents(): boolean;
  getExtraValue(componentIdx: number, state: number[]): number;
  fillExtraValues(state: number[], extra: number[]): void;
  clone(keepExtra?: boolean): LogicalModel;
  getView(neworder: NodeInfo[]): LogicalModel;
  isBoolean(): boolean;
  getComponent(id: string): NodeInfo | null;
  getComponentIndex(id: string): number;
  getBooleanizedMap(): Map<string, NodeInfo[]> | null;
  hasLayout(): boolean;
  getLayout(): ModelLayout;
  getAnnotator(): Annotator<NodeInfo>;
}

import type { MDDManager } from "mddlib-js";
import { Annotator } from "./metadata/Annotator";
import { AnnotationModule } from "./metadata/AnnotationModule";
import { LogicalModel } from "./LogicalModel";
import { ModelLayout } from "./ModelLayout";
import { NodeInfo } from "./NodeInfo";

export class LogicalModelImpl implements LogicalModel {
  private layout: ModelLayout | null = null;
  private readonly annotationModule = new AnnotationModule();

  constructor(
    private readonly coreNodes: NodeInfo[],
    private readonly ddmanager: MDDManager,
    private readonly coreFunctions: number[],
    private readonly extraNodes: NodeInfo[] = [],
    private readonly extraFunctions: number[] = []
  ) {
    for (const f of this.coreFunctions) {
      this.ddmanager.use(f);
    }
    for (const f of this.extraFunctions) {
      this.ddmanager.use(f);
    }
  }

  getMDDManager(): MDDManager {
    return this.ddmanager;
  }

  getComponents(): NodeInfo[] {
    return this.coreNodes;
  }

  getLogicalFunctions(): number[] {
    return this.coreFunctions;
  }

  getExtraComponents(): NodeInfo[] {
    return this.extraNodes;
  }

  getExtraLogicalFunctions(): number[] {
    return this.extraFunctions;
  }

  getTargetValue(componentIdx: number, state: number[]): number {
    return this.ddmanager.reach(this.coreFunctions[componentIdx], state);
  }

  hasExtraComponents(): boolean {
    return this.extraFunctions.length > 0;
  }

  getExtraValue(componentIdx: number, state: number[]): number {
    return this.ddmanager.reach(this.extraFunctions[componentIdx], state);
  }

  fillExtraValues(state: number[], extra: number[]): void {
    for (let i = 0; i < extra.length; i++) {
      extra[i] = this.getExtraValue(i, state);
    }
  }

  clone(keepExtra = true): LogicalModel {
    const model = new LogicalModelImpl(
      this.coreNodes.map((node) => node.clone()),
      this.ddmanager,
      this.coreFunctions.slice(),
      keepExtra ? this.extraNodes.map((node) => node.clone()) : [],
      keepExtra ? this.extraFunctions.slice() : []
    );
    if (this.layout != null) {
      const newLayout = model.getLayout();
      for (let i = 0; i < this.coreNodes.length; i++) {
        newLayout.copy(model.getComponents()[i], this.layout.getInfo(this.coreNodes[i]));
      }
      if (keepExtra) {
        for (let i = 0; i < this.extraNodes.length; i++) {
          newLayout.copy(model.getExtraComponents()[i], this.layout.getInfo(this.extraNodes[i]));
        }
      }
    }
    return model;
  }

  getView(neworder: NodeInfo[]): LogicalModel {
    const newmanager = this.ddmanager.getManager(neworder);
    const newFunctions = new Array<number>(this.coreFunctions.length);
    for (let i = 0; i < this.coreFunctions.length; i++) {
      const ni = this.coreNodes[i];
      newFunctions[neworder.indexOf(ni)] = this.coreFunctions[i];
    }
    return new LogicalModelImpl(neworder, newmanager, newFunctions, this.extraNodes, this.extraFunctions);
  }

  isBoolean(): boolean {
    return [...this.coreNodes, ...this.extraNodes].every((node) => node.getMax() <= 1);
  }

  getComponent(id: string): NodeInfo | null {
    return [...this.coreNodes, ...this.extraNodes].find((node) => node.getNodeID() === id) ?? null;
  }

  getComponentIndex(id: string): number {
    return [...this.coreNodes, ...this.extraNodes].findIndex((node) => node.getNodeID() === id);
  }

  getBooleanizedMap(): Map<string, NodeInfo[]> | null {
    return null;
  }

  hasLayout(): boolean {
    return this.layout != null;
  }

  getLayout(): ModelLayout {
    if (this.layout == null) {
      this.layout = new ModelLayout();
    }
    return this.layout;
  }

  getAnnotator(): Annotator<NodeInfo> {
    return new Annotator<NodeInfo>(this.annotationModule);
  }
}

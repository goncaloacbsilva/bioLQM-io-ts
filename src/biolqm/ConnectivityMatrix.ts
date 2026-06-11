import type { MDDManager, MDDVariable, VariableEffect } from "mddlib-js";
import { LogicalModel } from "./LogicalModel";

export class ConnectivityMatrix {
  private readonly ddmanager: MDDManager;
  private readonly variables: MDDVariable[];
  private readonly coreFunctions: number[];
  private readonly extraFunctions: number[];
  private readonly coreRegulators: number[][];
  private readonly extraRegulators: number[][];

  constructor(model: LogicalModel) {
    this.ddmanager = model.getMDDManager();
    this.variables = this.ddmanager.getAllVariables();
    this.coreFunctions = model.getLogicalFunctions();
    this.extraFunctions = model.getExtraLogicalFunctions();
    this.coreRegulators = this.fillRegulators(this.coreFunctions);
    this.extraRegulators = this.fillRegulators(this.extraFunctions);
  }

  private fillRegulators(functions: number[]): number[][] {
    return functions.map((functionId) => {
      const flags = this.ddmanager.collectDecisionVariables(functionId);
      const regulators: number[] = [];
      for (let i = 0; i < flags.length; i++) {
        if (flags[i]) {
          regulators.push(i);
        }
      }
      return regulators;
    });
  }

  getRegulators(idx: number, extra: boolean): number[] {
    return extra ? this.extraRegulators[idx] : this.coreRegulators[idx];
  }
}

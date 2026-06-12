import type { MDDManager } from "../MDDManager";
import { MDDVariable } from "../MDDVariable";
import type { NodeRelation } from "../NodeRelation";
import { VariableEffect } from "../VariableEffect";
import { MDDBaseOperators } from "../operators/MDDBaseOperators";
import type { MDDStore } from "./MDDStore";

export class MDDManagerProxy implements MDDManager {
  private variables: MDDVariable[];

  static getProxy(store: MDDStore, customOrder: unknown[]): MDDManager {
    const rawVariables = store.getAllVariables();

    let sameOrder = rawVariables.length === customOrder.length;
    const custom2store = new Array<number>(customOrder.length).fill(-1);
    let i = 0;
    for (const v of customOrder) {
      const variable = store.getVariableForKey(v)!;
      if (variable.order !== i) {
        sameOrder = false;
      }
      custom2store[i] = variable.order;
      i++;
    }

    if (sameOrder) {
      return store as unknown as MDDManager;
    }

    const store2custom = new Array<number>(rawVariables.length).fill(-1);
    i = 0;
    for (const k of custom2store) {
      if (k >= 0) {
        store2custom[k] = i;
      }
      i++;
    }
    return new MDDManagerProxy(store, custom2store, store2custom);
  }

  private constructor(
    private readonly store: MDDStore,
    private custom2store: number[],
    private store2custom: number[]
  ) {
    this.variables = new Array<MDDVariable>(custom2store.length);
    const storeVars = store.getAllVariables();
    let i = 0;
    for (const j of custom2store) {
      this.variables[i] = storeVars[j];
      i++;
    }
  }

  getManager(order: unknown[]): MDDManager {
    return this.store.getManager(order);
  }

  getNodeVariable(n: number): MDDVariable | null {
    return this.store.getNodeVariable(n);
  }

  getVariableForKey(key: unknown): MDDVariable | null {
    const variable = this.store.getVariableForKey(key);
    if (variable == null) {
      return null;
    }
    const idx = this.store2custom[variable.order];
    if (idx < 0) {
      return null;
    }
    return variable;
  }

  getVariableIndex(variable: MDDVariable): number {
    return this.store2custom[variable.order];
  }

  getAllVariables(): MDDVariable[] {
    return this.variables;
  }

  ensureVariable(key: unknown, nbval: number): MDDVariable {
    const inStore = this.store.ensureVariable(key, nbval);
    if (inStore.order >= this.variables.length) {
      const extended = this.variables.slice();
      extended.push(inStore);
      this.variables = extended;

      this.custom2store = this.extendmapping(this.custom2store, this.variables.length);
      this.store2custom = this.extendmapping(this.store2custom, this.variables.length);
    }
    return inStore;
  }

  private extendmapping(mapping: number[], l: number): number[] {
    if (l <= mapping.length) {
      return mapping;
    }
    const extended = mapping.slice();
    for (let i = mapping.length; i < l; i++) {
      extended[i] = i;
    }
    return extended;
  }

  free(pos: number): void {
    this.store.free(pos);
  }

  use(node: number): number {
    return this.store.use(node);
  }

  isleaf(node: number): boolean {
    return this.store.isleaf(node);
  }

  getChild(node: number, value: number): number {
    return this.store.getChild(node, value);
  }

  getChildren(node: number): number[] | null {
    return this.store.getChildren(node);
  }

  not(node: number): number {
    return this.store.not(node);
  }

  mnot(node: number, value: number): number {
    return this.store.mnot(node, value);
  }

  getRelation(first: number, other: number): NodeRelation {
    return this.store.getRelation(first, other);
  }

  getNodeCount(): number {
    return this.store.getNodeCount();
  }

  getLeafCount(): number {
    return this.store.getLeafCount();
  }

  getSign(node: number, pivot: MDDVariable): number {
    return this.store.getSign(node, pivot);
  }

  reach(node: number, values: number[]): number {
    return this.store.reach(node, values, this.store2custom);
  }

  groupReach(node: number, values: number[]): number {
    return this.store.groupReach(node, values, this.store2custom);
  }

  collectDecisionVariables(node: number): boolean[] {
    const inStore = this.store.collectDecisionVariables(node);
    const ret = new Array<boolean>(this.variables.length);
    for (let i = 0; i < ret.length; i++) {
      ret[i] = inStore[this.custom2store[i]];
    }
    return ret;
  }

  getVariableEffect(variable: MDDVariable, node: number): VariableEffect {
    return this.store.getVariableEffect(variable, node);
  }

  getMultivaluedVariableEffect(variable: MDDVariable, node: number): VariableEffect[] {
    return this.store.getMultivaluedVariableEffect(variable, node);
  }

  isView(ddm: MDDManager): boolean {
    if ((this.store as unknown as MDDManager) === ddm) {
      return true;
    }
    if (ddm instanceof MDDManagerProxy) {
      return this.store === ddm.store;
    }
    return false;
  }

  nodeFromState(state: number[], value: number): number {
    return this.store.nodeFromState(state, value, this.store2custom);
  }

  nodeFromStates(states: Iterable<number[]>, value: number): number {
    let node = 0;
    for (const state of states) {
      const newNode = this.nodeFromState(state, value);
      const nextNode = MDDBaseOperators.OR.combine(this, node, newNode);
      this.free(newNode);
      this.free(node);
      node = nextNode;
    }
    return node;
  }

  dumpMDD(node: number): string {
    return this.store.dumpMDD(node);
  }

  parseDump(s: string): number {
    return this.store.parseDump(s);
  }
}

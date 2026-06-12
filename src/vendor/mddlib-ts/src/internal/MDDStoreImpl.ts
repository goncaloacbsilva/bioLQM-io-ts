import { ParseException } from "../errors";
import type { MDDManager } from "../MDDManager";
import { MDDVariable } from "../MDDVariable";
import { MDDVariableFactory } from "../MDDVariableFactory";
import { NodeRelation } from "../NodeRelation";
import { combineVariableEffects, VariableEffect } from "../VariableEffect";
import { MDDBaseOperators } from "../operators/MDDBaseOperators";
import { MDDManagerProxy } from "./MDDManagerProxy";
import type { MDDStore } from "./MDDStore";

type NodeRecord = {
  level: number;
  children: number[];
  useCount: number;
};

class DumpedVariable {
  private readonly children: number[];
  private filled = 0;

  constructor(private readonly variable: MDDVariable) {
    this.children = new Array<number>(variable.nbval);
  }

  stack(child: number, p: number): void {
    if (this.filled >= this.variable.nbval) {
      throw new ParseException(
        `Too many children for variable ${this.variable.order}, trying to stack ${child}. Line ${p}`,
        p
      );
    }
    this.children[this.filled++] = child;
  }

  close(ddmanager: MDDManager, p: number): number {
    if (this.filled !== this.children.length) {
      throw new ParseException(`Bad number of children for variable ${this.variable.order}`, p);
    }

    const node = this.variable.getNode(this.children);
    for (const child of this.children) {
      ddmanager.free(child);
    }
    return node;
  }
}

export class MDDStoreImpl implements MDDStore {
  private static readonly NOTFLIP = [1, 0];

  protected variables: MDDVariable[];
  private readonly nbleaves: number;
  private readonly nodes = new Map<number, NodeRecord>();
  private readonly unique = new Map<string, number>();
  private nextId: number;

  constructor(keys: MDDVariableFactory | Iterable<unknown>, nbleaves: number) {
    if (keys instanceof MDDVariableFactory) {
      this.variables = this.getVariables(keys);
    } else {
      this.variables = this.getBooleanVariables(keys);
    }
    this.nbleaves = nbleaves;
    this.nextId = nbleaves;
  }

  getManager(order: unknown[]): MDDManager {
    return MDDManagerProxy.getProxy(this, order);
  }

  private getBooleanVariables(keys: Iterable<unknown>): MDDVariable[] {
    const variables: MDDVariable[] = [];
    let i = 0;
    for (const key of keys) {
      variables.push(new MDDVariable(this, i, key, 2));
      i++;
    }
    return variables;
  }

  private getVariables(keys: MDDVariableFactory): MDDVariable[] {
    const variables: MDDVariable[] = [];
    let i = 0;
    for (const key of keys) {
      variables.push(new MDDVariable(this, i, key, keys.getNbValue(key)));
      i++;
    }
    return variables;
  }

  getNodeVariable(n: number): MDDVariable | null {
    if (this.isleaf(n)) {
      return null;
    }
    const node = this.nodes.get(n);
    if (node == null) {
      throw new Error(`Invalid level found for ${n}: free/use bug?`);
    }
    return this.variables[node.level];
  }

  getVariableIndex(variable: MDDVariable): number {
    return variable.order;
  }

  getVariableForKey(key: unknown): MDDVariable | null {
    for (const variable of this.variables) {
      if (variable.key === key) {
        return variable;
      }
    }
    return null;
  }

  ensureVariable(key: unknown, nbval: number): MDDVariable {
    let variable = this.getVariableForKey(key);
    if (variable == null) {
      variable = new MDDVariable(this, this.variables.length, key, nbval);
      this.variables = this.variables.concat(variable);
    } else if (variable.nbval < nbval) {
      throw new Error("changing the number of values of a component is not supported");
    }
    return variable;
  }

  getAllVariables(): MDDVariable[] {
    return this.variables;
  }

  getNode(variable: number, leftChild: number, rightChild: number): number;
  getNode(variable: number, children: number[]): number;
  getNode(variable: number, arg1: number | number[], arg2?: number): number {
    const children = Array.isArray(arg1) ? arg1.slice() : [arg1, arg2 as number];
    if (children.every((child) => child === children[0])) {
      return this.use(children[0]);
    }

    for (const child of children) {
      if (!this.isleaf(child)) {
        const childLevel = this.nodes.get(child)!.level;
        if (childLevel <= variable) {
          return -1;
        }
      }
    }

    const key = `${variable}|${children.join(",")}`;
    const existing = this.unique.get(key);
    if (existing != null) {
      return this.use(existing);
    }

    const id = this.nextId++;
    this.nodes.set(id, { level: variable, children, useCount: 0 });
    this.unique.set(key, id);
    for (const child of children) {
      this.use(child);
    }
    return this.use(id);
  }

  use(node: number): number {
    if (!this.isleaf(node)) {
      this.nodes.get(node)!.useCount++;
    }
    return node;
  }

  free(pos: number): void {
    if (this.isleaf(pos)) {
      return;
    }
    const node = this.nodes.get(pos);
    if (node == null) {
      return;
    }
    node.useCount--;
    if (node.useCount > 0) {
      return;
    }
    this.nodes.delete(pos);
    this.unique.delete(`${node.level}|${node.children.join(",")}`);
    for (const child of node.children) {
      this.free(child);
    }
  }

  private leafFlip(node: number, newValues: number[]): number {
    if (this.isleaf(node)) {
      if (node >= newValues.length) {
        return node;
      }
      return newValues[node];
    }
    const record = this.nodes.get(node)!;
    const variable = this.variables[record.level];
    if (variable.nbval === 2) {
      const l = this.leafFlip(record.children[0], newValues);
      const r = this.leafFlip(record.children[1], newValues);
      const ret = this.getNode(record.level, l, r);
      this.free(l);
      this.free(r);
      return ret;
    }
    const children = record.children.map((child) => this.leafFlip(child, newValues));
    const ret = this.getNode(record.level, children);
    for (const child of children) {
      this.free(child);
    }
    return ret;
  }

  not(node: number): number {
    return this.leafFlip(node, MDDStoreImpl.NOTFLIP);
  }

  mnot(node: number, v: number): number {
    const flipper = new Array<number>(v + 1);
    flipper[0] = v;
    for (let i = 1; i < v; i++) {
      flipper[i] = i;
    }
    flipper[v] = 0;
    return this.leafFlip(node, flipper);
  }

  getRelation(first: number, other: number): NodeRelation {
    if (first === other) {
      return this.isleaf(first) ? NodeRelation.LL : NodeRelation.NN;
    }
    if (this.isleaf(first)) {
      return this.isleaf(other) ? NodeRelation.LL : NodeRelation.LN;
    }
    if (this.isleaf(other)) {
      return NodeRelation.NL;
    }
    const l1 = this.nodes.get(first)!.level;
    const l2 = this.nodes.get(other)!.level;
    if (l1 === l2) {
      return NodeRelation.NN;
    }
    return l1 < l2 ? NodeRelation.NNn : NodeRelation.NNf;
  }

  getNodeCount(): number {
    return this.nodes.size;
  }

  getLeafCount(): number {
    return this.nbleaves;
  }

  isleaf(id: number): boolean {
    return id < this.nbleaves;
  }

  getChild(id: number, value: number): number {
    if (this.isleaf(id)) {
      return -1;
    }
    if (value < 0) {
      return -5;
    }
    return this.nodes.get(id)!.children[value];
  }

  getChildren(node: number): number[] | null {
    if (this.isleaf(node)) {
      return null;
    }
    return this.nodes.get(node)!.children.slice();
  }

  reach(node: number, values: number[]): number;
  reach(node: number, values: number[], orderMap: number[]): number;
  reach(node: number, values: number[], orderMap?: number[]): number {
    if (orderMap == null) {
      while (!this.isleaf(node)) {
        const level = this.nodes.get(node)!.level;
        node = this.getChild(node, values[level]);
      }
      return node;
    }

    while (!this.isleaf(node)) {
      const level = this.nodes.get(node)!.level;
      node = this.getChild(node, values[orderMap[level]]);
    }
    return node;
  }

  groupReach(node: number, values: number[]): number;
  groupReach(node: number, values: number[], orderMap: number[]): number;
  groupReach(node: number, values: number[], orderMap?: number[]): number {
    if (orderMap != null) {
      throw new Error("Proxied group reach not implemented yet");
    }
    if (this.isleaf(node)) {
      return node;
    }

    const level = this.nodes.get(node)!.level;
    const v = values[level];
    if (v < 0) {
      let ret = this.groupReach(this.getChild(node, 0), values);
      if (ret < 0) {
        return -1;
      }
      const n = this.variables[level].nbval;
      for (let i = 1; i < n; i++) {
        const nret = this.groupReach(this.getChild(node, i), values);
        if (nret !== ret) {
          return -1;
        }
      }
      return ret;
    }

    return this.groupReach(this.getChild(node, v), values);
  }

  getSign(node: number, pivot: MDDVariable): number {
    return this.getSignInternal(node, pivot, 0);
  }

  private getSignInternal(node: number, pivot: MDDVariable, curSign: number): number {
    if (this.isleaf(node)) {
      return curSign;
    }

    const variable = this.getNodeVariable(node)!;
    if (variable.order < pivot.order) {
      for (let i = 0; i < variable.nbval; i++) {
        curSign = this.getSignInternal(this.getChild(node, i), pivot, curSign);
      }
    } else if (variable === pivot) {
      for (let i = 1; i < variable.nbval; i++) {
        curSign = this.getSignSub(this.getChild(node, i - 1), this.getChild(node, i), curSign);
      }
    }
    return curSign;
  }

  private getSignSub(n1: number, n2: number, curSign: number): number {
    if (n1 === n2) {
      return curSign;
    }
    let nbval: number;
    switch (this.getRelation(n1, n2)) {
      case NodeRelation.LL:
        if (n1 > n2) {
          if (curSign === 0) {
            curSign = -1;
          } else if (curSign === 1) {
            curSign = 2;
          }
        } else if (n1 < n2) {
          if (curSign === 0) {
            curSign = 1;
          } else if (curSign === -1) {
            curSign = 2;
          }
        }
        break;
      case NodeRelation.LN:
      case NodeRelation.NNf:
        nbval = this.getNodeVariable(n2)!.nbval;
        for (let i = 0; i < nbval; i++) {
          curSign = this.getSignSub(n1, this.getChild(n2, i), curSign);
        }
        break;
      case NodeRelation.NL:
      case NodeRelation.NNn:
        nbval = this.getNodeVariable(n1)!.nbval;
        for (let i = 0; i < nbval; i++) {
          curSign = this.getSignSub(this.getChild(n1, i), n2, curSign);
        }
        break;
      case NodeRelation.NN:
        nbval = this.getNodeVariable(n1)!.nbval;
        for (let i = 0; i < nbval; i++) {
          curSign = this.getSignSub(this.getChild(n1, i), this.getChild(n2, i), curSign);
        }
        break;
    }
    return curSign;
  }

  collectDecisionVariables(node: number): boolean[] {
    const vars = new Array<boolean>(this.variables.length).fill(false);
    this.collectDecisionVariablesInternal(vars, node);
    return vars;
  }

  private collectDecisionVariablesInternal(flags: boolean[], node: number): void {
    const variable = this.getNodeVariable(node);
    if (variable == null) {
      return;
    }
    flags[variable.order] = true;
    for (let i = 0; i < variable.nbval; i++) {
      this.collectDecisionVariablesInternal(flags, this.getChild(node, i));
    }
  }

  getVariableEffect(variable: MDDVariable, node: number): VariableEffect {
    const curVar = this.getNodeVariable(node);
    if (curVar == null || curVar.after(variable)) {
      return VariableEffect.NONE;
    }

    if (curVar.equals(variable)) {
      let effect = VariableEffect.NONE;
      let curChild = this.getChild(node, 0);
      for (let value = 1; value < variable.nbval; value++) {
        const nextChild = this.getChild(node, value);
        if (nextChild !== curChild) {
          effect = combineVariableEffects(effect, this.lookupEffect(curChild, nextChild));
          curChild = nextChild;
        }
      }
      return effect;
    }

    let curChild = this.getChild(node, 0);
    let effect = this.getVariableEffect(variable, curChild);
    for (let value = 1; value < curVar.nbval; value++) {
      const nextChild = this.getChild(node, value);
      if (nextChild !== curChild) {
        curChild = nextChild;
        effect = combineVariableEffects(effect, this.getVariableEffect(variable, nextChild));
        if (effect === VariableEffect.DUAL) {
          return effect;
        }
      }
    }
    return effect;
  }

  getMultivaluedVariableEffect(variable: MDDVariable, node: number): VariableEffect[] {
    if (variable.nbval === 2) {
      return [this.getVariableEffect(variable, node)];
    }
    const effects = new Array<VariableEffect>(variable.nbval - 1).fill(VariableEffect.NONE);
    this.inspectVariableEffect(variable, node, effects);
    return effects;
  }

  private inspectVariableEffect(
    variable: MDDVariable,
    node: number,
    effects: VariableEffect[]
  ): void {
    const curVar = this.getNodeVariable(node);
    if (curVar == null || curVar.after(variable)) {
      return;
    }

    if (curVar.equals(variable)) {
      let curChild = this.getChild(node, 0);
      for (let value = 1; value < variable.nbval; value++) {
        const nextChild = this.getChild(node, value);
        if (nextChild !== curChild) {
          effects[value - 1] = combineVariableEffects(
            effects[value - 1],
            this.lookupEffect(curChild, nextChild)
          );
          curChild = nextChild;
        }
      }
      return;
    }

    let curChild = this.getChild(node, 0);
    this.inspectVariableEffect(variable, curChild, effects);
    for (let value = 1; value < curVar.nbval; value++) {
      const nextChild = this.getChild(node, value);
      if (nextChild !== curChild) {
        curChild = nextChild;
        this.inspectVariableEffect(variable, nextChild, effects);
      }
    }
  }

  private lookupEffect(low: number, high: number): VariableEffect {
    const relation = this.getRelation(low, high);
    switch (relation) {
      case NodeRelation.LL:
        if (low < high) {
          return VariableEffect.POSITIVE;
        }
        if (low > high) {
          return VariableEffect.NEGATIVE;
        }
        return VariableEffect.NONE;
      case NodeRelation.LN:
      case NodeRelation.NNf: {
        const variable = this.getNodeVariable(high)!;
        let curChild = this.getChild(high, 0);
        let effect = this.lookupEffect(low, curChild);
        for (let value = 1; value < variable.nbval; value++) {
          const nextChild = this.getChild(high, value);
          if (nextChild !== curChild) {
            curChild = nextChild;
            effect = combineVariableEffects(effect, this.lookupEffect(low, nextChild));
            if (effect === VariableEffect.DUAL) {
              return effect;
            }
          }
        }
        return effect;
      }
      case NodeRelation.NL:
      case NodeRelation.NNn: {
        const variable = this.getNodeVariable(low)!;
        let curChild = this.getChild(low, 0);
        let effect = this.lookupEffect(curChild, high);
        for (let value = 1; value < variable.nbval; value++) {
          const nextChild = this.getChild(low, value);
          if (nextChild !== curChild) {
            curChild = nextChild;
            effect = combineVariableEffects(effect, this.lookupEffect(nextChild, high));
            if (effect === VariableEffect.DUAL) {
              return effect;
            }
          }
        }
        return effect;
      }
      case NodeRelation.NN: {
        const variable = this.getNodeVariable(high)!;
        let curChild = this.getChild(high, 0);
        let curChildLow = this.getChild(low, 0);
        let effect = this.lookupEffect(curChildLow, curChild);
        for (let value = 1; value < variable.nbval; value++) {
          const nextChild = this.getChild(high, value);
          const nextChildLow = this.getChild(low, value);
          if (nextChild !== curChild || nextChildLow !== curChildLow) {
            curChild = nextChild;
            curChildLow = nextChildLow;
            effect = combineVariableEffects(effect, this.lookupEffect(nextChildLow, nextChild));
            if (effect === VariableEffect.DUAL) {
              return effect;
            }
          }
        }
        return effect;
      }
      default:
        throw new Error("Invalid node relation");
    }
  }

  isView(ddm: MDDManager): boolean {
    if (ddm === this) {
      return true;
    }
    if (ddm instanceof MDDManagerProxy) {
      return ddm.isView(this);
    }
    return false;
  }

  nodeFromState(state: number[], value: number): number;
  nodeFromState(state: number[], value: number, orderMap: number[]): number;
  nodeFromState(state: number[], value: number, orderMap?: number[]): number {
    if (orderMap == null) {
      if (value < 1) {
        return value;
      }
      let node = value;
      for (let l = this.variables.length - 1; l > -1; l--) {
        node = this.getSingleChildNode(l, state[l], node);
      }
      return node;
    }
    if (value < 1) {
      return value;
    }
    let node = value;
    for (let l = this.variables.length - 1; l > -1; l--) {
      const v = state[orderMap[l]];
      const nextNode = this.getSingleChildNode(l, value, node);
      this.free(node);
      node = nextNode;
      void v;
    }
    return node;
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

  private getSingleChildNode(level: number, value: number, child: number): number {
    if (value < 0) {
      return child;
    }

    const variable = this.variables[level];
    if (variable.nbval === 2) {
      if (value === 0) {
        return variable.getNode(child, 0);
      }
      return variable.getNode(0, child);
    }
    const children = new Array<number>(variable.nbval).fill(0);
    children[value] = child;
    return variable.getNode(children);
  }

  dumpMDD(mdd: number): string {
    if (this.isleaf(mdd)) {
      return `${mdd}`;
    }
    const variable = this.getNodeVariable(mdd)!;
    const children = this.getChildren(mdd)!;
    return `(${variable.order},${children.map((child) => this.dumpMDD(child)).join(",")})`;
  }

  parseDump(s: string): number {
    const length = s.length;
    if (length === 1) {
      const n = Number.parseInt(s, 10);
      if (this.isleaf(n)) {
        return n;
      }
      throw new ParseException("Value > max leaf", 0);
    }

    const stack: DumpedVariable[] = [];
    let node = -1;
    for (let i = 0; i < length; i++) {
      const c = s.charAt(i);
      if (c === "(") {
        i++;
        const nPos = this.findValueEnd(s, i);
        const level = Number.parseInt(s.substring(i, nPos), 10);
        stack.push(new DumpedVariable(this.variables[level]));
        i = nPos - 1;
      } else if (c === ")") {
        node = stack.pop()!.close(this, i);
        if (stack.length === 0) {
          if (i < length - 1) {
            throw new ParseException("Malformed MDD dump", i);
          }
          return node;
        }
        stack[stack.length - 1].stack(node, i);
      } else if (c === ",") {
      } else {
        const nPos = this.findValueEnd(s, i);
        node = Number.parseInt(s.substring(i, nPos), 10);
        if (!this.isleaf(node)) {
          throw new ParseException("Value > max leaf", 0);
        }
        i = nPos - 1;
        if (stack.length === 0) {
          if (i < length - 1) {
            throw new ParseException("Malformed MDD dump", i);
          }
          return node;
        }
        stack[stack.length - 1].stack(node, i);
      }
    }
    throw new ParseException("Malformed MDD dump", s.length);
  }

  private findValueEnd(s: string, i: number): number {
    while (/\d/.test(s.charAt(i))) {
      i++;
    }
    return i;
  }
}

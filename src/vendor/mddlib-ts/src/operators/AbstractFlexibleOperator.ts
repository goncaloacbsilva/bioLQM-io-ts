import type { MDDManager } from "../MDDManager";
import { NodeRelation } from "../NodeRelation";
import { AbstractOperator } from "./AbstractOperator";

export enum MergeAction {
  RECURSIVE,
  THIS,
  OTHER,
  MIN,
  MAX,
  ASKME,
  CUSTOM
}

export abstract class AbstractFlexibleOperator extends AbstractOperator {
  private locked = false;
  private readonly actions: MergeAction[];

  protected constructor(action: MergeAction, multipleMerge = false) {
    super(multipleMerge);
    this.actions = new Array(Object.keys(NodeRelation).length / 2).fill(MergeAction.RECURSIVE);
    this.setAction(NodeRelation.LL, action);
  }

  protected setAction(relation: NodeRelation, action: MergeAction): void {
    if (this.locked) {
      return;
    }
    this.actions[relation] = action;
  }

  protected lock(): void {
    this.locked = true;
  }

  protected combinePair(ddmanager: MDDManager, first: number, other: number): number {
    const status = ddmanager.getRelation(first, other);
    let action = this.actions[status];
    if (action === MergeAction.ASKME) {
      action = this.ask(ddmanager, status, first, other);
    }
    switch (action) {
      case MergeAction.CUSTOM:
        return this.custom(ddmanager, status, first, other);
      case MergeAction.RECURSIVE:
        return this.recurse(ddmanager, status, first, other);
      case MergeAction.THIS:
        return ddmanager.use(first);
      case MergeAction.OTHER:
        return ddmanager.use(other);
      case MergeAction.MIN:
        return ddmanager.use(first > other ? other : first);
      case MergeAction.MAX:
        return ddmanager.use(first > other ? first : other);
      default:
        return -1;
    }
  }

  ask(
    _ddmanager: MDDManager,
    _status: NodeRelation,
    _first: number,
    _other: number
  ): MergeAction {
    return MergeAction.RECURSIVE;
  }

  custom(
    _ddmanager: MDDManager,
    _status: NodeRelation,
    _first: number,
    _other: number
  ): number {
    return -1;
  }
}

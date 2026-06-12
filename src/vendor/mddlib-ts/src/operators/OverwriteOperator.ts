import type { MDDManager } from "../MDDManager";
import type { MDDOperator } from "../MDDOperator";
import { NodeRelation } from "../NodeRelation";
import { AbstractFlexibleOperator, MergeAction } from "./AbstractFlexibleOperator";

export class OverwriteOperator extends AbstractFlexibleOperator {
  static readonly ACTIONS_OVERWRITE: MDDOperator[] = [
    new OverwriteOperator(0),
    new OverwriteOperator(1),
    new OverwriteOperator(2)
  ];

  static getOverwriteAction(value: number): MDDOperator {
    if (value >= 0 && value < OverwriteOperator.ACTIONS_OVERWRITE.length) {
      return OverwriteOperator.ACTIONS_OVERWRITE[value];
    }
    return new OverwriteOperator(value);
  }

  private readonly value: number;

  constructor(value: number) {
    super(MergeAction.CUSTOM);
    this.setAction(NodeRelation.NL, MergeAction.CUSTOM);
    this.value = value;
    this.lock();
  }

  custom(ddmanager: MDDManager, type: NodeRelation, first: number, other: number): number {
    switch (type) {
      case NodeRelation.LL:
      case NodeRelation.NL:
        if (other > 0) {
          return ddmanager.use(this.value);
        }
        return ddmanager.use(first);
      default:
        return first;
    }
  }
}

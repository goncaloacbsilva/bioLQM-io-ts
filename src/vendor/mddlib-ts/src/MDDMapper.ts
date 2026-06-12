import type { IndexMapper } from "./IndexMapper";
import type { MDDManager } from "./MDDManager";
import { PathSearcher } from "./PathSearcher";
import { MDDBaseOperators } from "./operators/MDDBaseOperators";

export class MDDMapper {
  private readonly searcher: PathSearcher;
  private readonly variables;

  constructor(
    private readonly sourceDDM: MDDManager,
    private readonly targetDDM: MDDManager,
    private readonly indexMapper: IndexMapper
  ) {
    this.searcher = new PathSearcher(sourceDDM, 1, Number.MAX_SAFE_INTEGER);
    this.variables = targetDDM.getAllVariables();
  }

  mapMDD(node: number): number {
    let result = 0;
    const path = this.searcher.setNode(node);
    for (const value of this.searcher) {
      let curBranch = 1;
      for (let i = 0; i < path.length; i++) {
        const v = path[i];
        if (v >= 0) {
          const curVar = this.variables[this.indexMapper.get(i)].getNodeForValue(v, value);
          const nextBranch = MDDBaseOperators.AND.combine(this.targetDDM, curBranch, curVar);
          this.targetDDM.free(curBranch);
          this.targetDDM.free(curVar);
          curBranch = nextBranch;
        }
      }

      const next = MDDBaseOperators.OVER.combine(this.targetDDM, result, curBranch);
      this.targetDDM.free(curBranch);
      this.targetDDM.free(result);
      result = next;
    }
    return result;
  }
}

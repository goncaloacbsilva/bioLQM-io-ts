import type { MDDComparator } from "./MDDComparator";
import type { MDDManager } from "./MDDManager";
import { MDDVariable } from "./MDDVariable";
import { PathSearcher } from "./PathSearcher";

export class MDDComparatorFactory {
  static getComparator(ddm1: MDDManager, ddm2: MDDManager): MDDComparator {
    if (ddm1.isView(ddm2)) {
      return new IdenticalComparator();
    }

    const shared = MDDComparatorFactory.getSharedVars(ddm1, ddm2);
    if (MDDComparatorFactory.areCompatible(shared)) {
      return new CompatibleComparator(ddm1, ddm2);
    }
    return new HeavyComparator(ddm1, ddm2);
  }

  private static getSharedVars(ddm1: MDDManager, ddm2: MDDManager): MDDVariable[][] {
    const shared: MDDVariable[][] = [];
    for (const v1 of ddm1.getAllVariables()) {
      const v2 = ddm2.getVariableForKey(v1.key);
      if (v2 == null) {
        continue;
      }

      let pos = 0;
      for (const orders of shared) {
        if (orders[0].order > v1.order) {
          break;
        }
        pos++;
      }
      shared.splice(pos, 0, [v1, v2]);
    }
    return shared;
  }

  private static areCompatible(shared: MDDVariable[][]): boolean {
    let o1 = -1;
    let o2 = -1;
    for (const orders of shared) {
      if (orders[0].nbval !== orders[1].nbval) {
        return false;
      }
      if (orders[0].order <= o1 || orders[1].order <= o2) {
        return false;
      }
      o1 = orders[0].order;
      o2 = orders[1].order;
    }
    return true;
  }
}

class IdenticalComparator implements MDDComparator {
  similar(n1: number, n2: number): boolean {
    return n1 === n2;
  }
}

class CompatibleComparator implements MDDComparator {
  constructor(
    private readonly ddm1: MDDManager,
    private readonly ddm2: MDDManager
  ) {}

  similar(n1: number, n2: number): boolean {
    const v1 = this.ddm1.getNodeVariable(n1);
    const v2 = this.ddm2.getNodeVariable(n2);

    if (v1 == null) {
      return v2 == null;
    }
    if (v2 == null) {
      return false;
    }
    if (!v1.equals(v2)) {
      return false;
    }

    for (let i = 0; i < v1.nbval; i++) {
      const c1 = this.ddm1.getChild(n1, i);
      const c2 = this.ddm2.getChild(n2, i);
      if (!this.similar(c1, c2)) {
        return false;
      }
    }
    return true;
  }
}

class HeavyComparator implements MDDComparator {
  private readonly searcher: PathSearcher;
  private readonly pathMap: number[];
  private readonly path2: number[];

  constructor(
    private readonly ddm1: MDDManager,
    private readonly ddm2: MDDManager
  ) {
    this.searcher = new PathSearcher(ddm1);
    this.pathMap = new Array<number>(ddm1.getAllVariables().length).fill(-1);
    let i = -1;
    for (const v of ddm1.getAllVariables()) {
      i++;
      const v2 = ddm2.getVariableForKey(v.key);
      if (v2 == null || v2.nbval !== v.nbval) {
        continue;
      }
      this.pathMap[i] = ddm2.getVariableIndex(v2);
    }
    this.path2 = new Array<number>(ddm2.getAllVariables().length).fill(0);
  }

  similar(n1: number, n2: number): boolean {
    const path = this.searcher.setNode(n1);
    for (const value of this.searcher) {
      const p2 = this.fillPath(path);
      if (p2 == null) {
        return false;
      }
      const v2 = this.ddm2.groupReach(n2, p2);
      if (v2 !== value) {
        return false;
      }
    }
    return true;
  }

  private fillPath(path: number[]): number[] | null {
    for (let i = 0; i < path.length; i++) {
      const v = path[i];
      const i2 = this.pathMap[i];
      if (v < 0 && i2 < 0) {
        continue;
      }
      if (i2 < 0) {
        return null;
      }
      this.path2[i2] = v;
    }
    return this.path2;
  }
}

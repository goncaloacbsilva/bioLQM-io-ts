import { MDDBaseOperators, MDDManager, MDDManagerFactory, MDDVariableFactory, PathSearcher } from "../src";

export class NQueens {
  static testBNQueens(N: number): number {
    const nbvar = N * N;
    const keys: string[] = [];
    const basics = Array.from({ length: nbvar }, () => [0, 0]);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        keys.push(`${i},${j}`);
      }
    }
    const ddmanager = MDDManagerFactory.getManager(keys, 2);
    const variables = ddmanager.getAllVariables();
    for (let i = 0; i < nbvar; i++) {
      basics[i][0] = variables[i].getNode(1, 0);
      basics[i][1] = variables[i].getNode(0, 1);
    }

    const elts = new Array<number>(N);
    const all_cst = new Array<number>(N + nbvar * N * 4).fill(0);
    let cstidx = 0;
    for (let i = 0; i < N; i++) {
      const row = i * N;
      for (let j = 0; j < N; j++) {
        elts[j] = basics[row + j][1];
      }
      all_cst[cstidx++] = MDDBaseOperators.OR.combine(ddmanager, elts);
    }

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const pos = i * N + j;
        for (let k = 0; k < N; k++) {
          if (k > i) {
            all_cst[cstidx++] = NQueens.get_nand(ddmanager, basics, pos, k * N + j);
          }
          if (k > j) {
            all_cst[cstidx++] = NQueens.get_nand(ddmanager, basics, pos, i * N + k);
            const dj = k - j;
            let r = i + dj;
            if (r < N) {
              all_cst[cstidx++] = NQueens.get_nand(ddmanager, basics, pos, r * N + k);
            }
            r = i - dj;
            if (r >= 0) {
              all_cst[cstidx++] = NQueens.get_nand(ddmanager, basics, pos, r * N + k);
            }
          }
        }
      }
    }
    const defined_cst = all_cst.slice(0, cstidx);
    const result = MDDBaseOperators.AND.combine(ddmanager, defined_cst);
    for (const i of defined_cst) {
      ddmanager.free(i);
    }
    const searcher = new PathSearcher(ddmanager, 1);
    searcher.setNode(result);
    return searcher.countPaths();
  }

  private static get_nand(ddmanager: MDDManager, basics: number[][], p1: number, p2: number): number {
    return MDDBaseOperators.OR.combine(ddmanager, basics[p1][0], basics[p2][0]);
  }

  static testMNQueens(N: number): number {
    const nbvar = N;
    const vbuilder = new MDDVariableFactory();
    for (let i = 0; i < N; i++) {
      vbuilder.add(`${i}`, N);
    }
    const ddmanager = MDDManagerFactory.getManager(vbuilder, 2);
    const variables = ddmanager.getAllVariables();
    const basics = Array.from({ length: nbvar * nbvar }, () => [0, 0]);
    for (let i = 0; i < nbvar; i++) {
      for (let j = 0; j < nbvar; j++) {
        let children = new Array<number>(nbvar).fill(0);
        children[j] = 1;
        basics[i * N + j][1] = variables[i].getNode(children);

        children = new Array<number>(nbvar).fill(0);
        for (let v = 0; v < nbvar; v++) {
          if (v !== j) {
            children[v] = 1;
          }
        }
        basics[i * N + j][0] = variables[i].getNode(children);
      }
    }

    const all_cst = new Array<number>(nbvar * nbvar * N * 4).fill(0);
    let cstidx = 0;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const pos = i * N + j;
        for (let k = Math.min(i, j) + 1; k < N; k++) {
          if (k > i) {
            all_cst[cstidx++] = NQueens.get_nand(ddmanager, basics, pos, k * N + j);
          }
          if (k > j) {
            const dj = k - j;
            let r = i + dj;
            if (r < N) {
              all_cst[cstidx++] = NQueens.get_nand(ddmanager, basics, pos, r * N + k);
            }
            r = i - dj;
            if (r >= 0) {
              all_cst[cstidx++] = NQueens.get_nand(ddmanager, basics, pos, r * N + k);
            }
          }
        }
      }
    }
    const defined_cst = all_cst.slice(0, cstidx);
    const result = MDDBaseOperators.AND.combine(ddmanager, defined_cst);
    const searcher = new PathSearcher(ddmanager, 1);
    searcher.setNode(result);
    return searcher.countPaths();
  }
}

import {
  MDDManager,
  MDDManagerFactory,
  MDDVariable,
  MDDVariableFactory,
  PathSearcher,
  VariableEffect
} from "../src";

export function getSimpleManager(size: number): MDDManager {
  const keys: string[] = [];
  for (let i = 0; i < size; i++) {
    keys.push(`var${i}`);
  }
  return MDDManagerFactory.getManager(keys, 10);
}

function checkPath(ps: PathSearcher, node: number, expected: number[][]): void {
  const path = ps.setNode(node);
  let n = 0;
  for (const _v of ps) {
    const curExpected = expected[n];
    for (let i = 0; i < path.length; i++) {
      expect(path[i]).toBe(curExpected[i]);
    }
    n++;
  }
}

describe("TestMDD", () => {
  test("testConstruction", () => {
    const ddmanager = getSimpleManager(5);
    const variables = ddmanager.getAllVariables();

    let c = 0;
    expect(ddmanager.getNodeCount()).toBe(c);

    variables[4].getNode(0, 1);
    c++;
    expect(ddmanager.getNodeCount()).toBe(c);

    const n1 = variables[4].getNode(0, 1);
    expect(ddmanager.getNodeCount()).toBe(c);

    const n2 = variables[3].getNode(0, 0);
    expect(n2).toBe(0);
    expect(ddmanager.getNodeCount()).toBe(c);

    const node = variables[4].getNode(1, 0);
    c++;
    expect(ddmanager.getNodeCount()).toBe(c);

    let newnode = variables[4].getNode(node, node);
    expect(newnode).toBe(node);
    expect(ddmanager.getNodeCount()).toBe(c);

    newnode = variables[2].getNode(n1, n2);
    c++;
    expect(ddmanager.getNodeCount()).toBe(c);

    const paths = new PathSearcher(ddmanager);
    const path = paths.setNode(newnode);
    let nbpaths = 0;
    for (const _leaf of paths) {
      nbpaths++;
      expect(path[0]).toBe(-1);
      expect(path[1]).toBe(-1);
      expect(path[3]).toBe(-1);
      switch (nbpaths) {
        case 1:
          expect(path[2]).toBe(0);
          expect(path[4]).toBe(0);
          break;
        case 2:
          expect(path[2]).toBe(0);
          expect(path[4]).toBe(1);
          break;
        case 3:
          expect(path[2]).toBe(1);
          expect(path[4]).toBe(-1);
          break;
        default:
          throw new Error("bad number of paths");
      }
    }

    const dump = ddmanager.dumpMDD(newnode);
    expect(ddmanager.parseDump(dump)).toBe(newnode);
  });

  test("testOrderProxy", () => {
    const manager = getSimpleManager(5);
    const variables = manager.getAllVariables();

    const keys2: string[] = [];
    const altOrder = [3, 1, 4, 0, 2];
    for (const i of altOrder) {
      keys2.push(variables[i].key as string);
    }

    const pManager = manager.getManager(keys2);

    let node = variables[4].getNode(0, 1);
    node = variables[2].getNode(node, 0);
    const n1 = variables[1].getNode(1, node);
    node = variables[0].getNode(node, 1);

    let values = [0, 0, 1, 0, 0];
    expect(manager.reach(node, values)).toBe(0);
    expect(pManager.reach(node, values)).toBe(1);
    expect(manager.reach(n1, values)).toBe(1);
    expect(pManager.reach(n1, values)).toBe(1);

    values = [0, 1, 0, 0, 1];
    expect(manager.reach(node, values)).toBe(1);
    expect(pManager.reach(node, values)).toBe(0);
    expect(manager.reach(n1, values)).toBe(1);
    expect(pManager.reach(n1, values)).toBe(0);

    values = [1, 1, 1, 0, 0];
    expect(manager.reach(node, values)).toBe(1);
    expect(pManager.reach(node, values)).toBe(1);
    expect(manager.reach(n1, values)).toBe(0);
    expect(pManager.reach(n1, values)).toBe(1);

    const ps = new PathSearcher(manager, 1);
    const ps2 = new PathSearcher(pManager, 1);

    checkPath(ps, node, [
      [0, -1, 0, -1, 1],
      [1, -1, -1, -1, -1]
    ]);
    checkPath(ps2, node, [
      [-1, -1, 1, 0, 0],
      [-1, -1, -1, 1, -1]
    ]);

    checkPath(ps, n1, [
      [-1, 0, -1, -1, -1],
      [-1, 1, 0, -1, 1]
    ]);
    checkPath(ps2, n1, [
      [-1, 0, -1, -1, -1],
      [-1, 1, 1, -1, 0]
    ]);

    ps.setNode(1);
    let first = true;
    for (const _l of ps) {
      if (!first) {
        throw new Error("Should get only one path");
      }
      for (const v of ps.getPath()) {
        expect(v).toBe(-1);
      }
      first = false;
    }
  });

  test("testInferSign", () => {
    const ddmanager = getSimpleManager(5);
    const variables = ddmanager.getAllVariables();

    const n1 = variables[4].getNode(0, 1);
    const n2 = variables[4].getNode(1, 0);
    const n3 = variables[2].getNode(n1, n2);

    expect(ddmanager.getVariableEffect(variables[0], 0)).toBe(VariableEffect.NONE);
    expect(ddmanager.getVariableEffect(variables[0], n1)).toBe(VariableEffect.NONE);
    expect(ddmanager.getVariableEffect(variables[0], n2)).toBe(VariableEffect.NONE);
    expect(ddmanager.getVariableEffect(variables[0], n3)).toBe(VariableEffect.NONE);

    expect(ddmanager.getVariableEffect(variables[4], n1)).toBe(VariableEffect.POSITIVE);
    expect(ddmanager.getVariableEffect(variables[4], n2)).toBe(VariableEffect.NEGATIVE);
    expect(ddmanager.getVariableEffect(variables[4], n3)).toBe(VariableEffect.DUAL);
    expect(ddmanager.getVariableEffect(variables[2], n3)).toBe(VariableEffect.DUAL);
    expect(ddmanager.getVariableEffect(variables[3], n3)).toBe(VariableEffect.NONE);
  });

  test("testIntervalPathSearcher", () => {
    const varFactory = new MDDVariableFactory();
    for (let i = 0; i < 5; i++) {
      varFactory.add(`var${i}`, 3);
    }
    const ddmanager = MDDManagerFactory.getManager(varFactory, 10);
    const variables = ddmanager.getAllVariables();

    const n1 = variables[4].getNode([0, 0, 1]);
    const n2 = variables[4].getNode([1, 0, 0]);
    const n3 = variables[2].getNode([1, n1, n2]);

    const ps = new PathSearcher(ddmanager, true);
    checkPath(ps, n3, [
      [-1, -1, 0, -1, -1],
      [-1, -1, 1, -1, 0],
      [-1, -1, 1, -1, 2],
      [-1, -1, 2, -1, 0],
      [-1, -1, 2, -1, 1]
    ]);
  });

  test("testMultivaluedNot", () => {
    const varFactory = new MDDVariableFactory();
    for (let i = 0; i < 5; i++) {
      varFactory.add(`var${i}`, 3);
    }
    const ddmanager = MDDManagerFactory.getManager(varFactory, 10);
    const variables = ddmanager.getAllVariables();

    const n1 = variables[4].getNode([0, 0, 1]);
    const n2 = variables[4].getNode([1, 0, 0]);
    const n3 = variables[2].getNode([1, n1, n2]);

    let n4 = ddmanager.not(n1);
    n4 = ddmanager.not(n4);
    expect(n4).toBe(n1);

    n4 = ddmanager.not(n2);
    n4 = ddmanager.not(n4);
    expect(n4).toBe(n2);

    n4 = ddmanager.not(n3);
    n4 = ddmanager.not(n4);
    expect(n4).toBe(n3);
  });
});

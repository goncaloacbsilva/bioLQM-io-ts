import { MDDComparatorFactory, MDDManager, MDDVariable } from "../src";
import { getSimpleManager } from "./TestMDD.test";

function getMDDExample1(ddmanager: MDDManager): number {
  const variables = ddmanager.getAllVariables();
  variables[4].getNode(0, 1);
  const n1 = variables[4].getNode(0, 1);
  const n2 = variables[3].getNode(0, 0);
  const node = variables[4].getNode(1, 0);
  let newnode = variables[4].getNode(node, node);
  newnode = variables[2].getNode(n1, n2);
  return newnode;
}

function getMDDExample2(ddmanager: MDDManager): number {
  const variables = ddmanager.getAllVariables();
  variables[3].getNode(0, 1);
  const n1 = variables[3].getNode(0, 1);
  const n2 = variables[1].getNode(0, 0);
  const node = variables[3].getNode(1, 0);
  let newnode = variables[3].getNode(node, node);
  newnode = variables[2].getNode(n1, n2);
  return newnode;
}

describe("TestComparators", () => {
  test("test", () => {
    const ddm1 = getSimpleManager(5);
    const ddm2 = getSimpleManager(5);

    const n1 = getMDDExample1(ddm1);
    const m1 = getMDDExample2(ddm1);

    const m2 = getMDDExample2(ddm2);
    const n2 = getMDDExample1(ddm2);

    const comparator = MDDComparatorFactory.getComparator(ddm1, ddm2);

    expect(comparator.similar(n1, n2)).toBe(true);
    expect(comparator.similar(m1, m2)).toBe(true);
    expect(comparator.similar(n1, m2)).toBe(false);
  });
});

import * as fs from "fs";
import { LogicalModel, LQMServiceManager, NodeInfo } from "../src";
import { TestHelper } from "./TestHelper";

function enumerateStates(maxima: number[]): number[][] {
  const states: number[][] = [];
  const current = new Array<number>(maxima.length).fill(0);

  function visit(idx: number): void {
    if (idx === maxima.length) {
      states.push(current.slice());
      return;
    }
    for (let value = 0; value <= maxima[idx]; value++) {
      current[idx] = value;
      visit(idx + 1);
    }
  }

  visit(0);
  return states;
}

function getComponentSummary(model: LogicalModel): Array<{ id: string; name: string; max: number; input: boolean }> {
  return model.getComponents().map((node) => ({
    id: node.getNodeID(),
    name: node.getName(),
    max: node.getMax(),
    input: node.isInput()
  }));
}

function expectModelsEquivalent(expected: LogicalModel, actual: LogicalModel): void {
  expect(getComponentSummary(actual)).toEqual(getComponentSummary(expected));
  expect(actual.getExtraComponents().length).toBe(expected.getExtraComponents().length);

  const maxima = expected.getComponents().map((node) => node.getMax());
  for (const state of enumerateStates(maxima)) {
    for (let idx = 0; idx < maxima.length; idx++) {
      expect(actual.getTargetValue(idx, state)).toBe(expected.getTargetValue(idx, state));
    }
  }

  expect(actual.hasLayout()).toBe(expected.hasLayout());
  if (expected.hasLayout()) {
    const expectedLayout = expected.getLayout();
    const actualLayout = actual.getLayout();
    for (const expectedNode of expected.getComponents()) {
      const actualNode = actual.getComponent(expectedNode.getNodeID());
      expect(actualNode).toBeTruthy();

      const expectedInfo = expectedLayout.getInfo(expectedNode);
      const actualInfo = actualLayout.getInfo(actualNode!);

      if (expectedInfo == null) {
        expect(actualInfo).toBeUndefined();
        continue;
      }

      expect(actualInfo).toBeTruthy();
      expect(actualInfo!.x).toBe(expectedInfo.x);
      expect(actualInfo!.y).toBe(expectedInfo.y);
      expect(actualInfo!.width).toBe(expectedInfo.width);
      expect(actualInfo!.height).toBe(expectedInfo.height);
    }
  }
}

function expectTargetsStayWithinBounds(model: LogicalModel): void {
  const maxima = model.getComponents().map((node) => node.getMax());
  for (const state of enumerateStates(maxima)) {
    for (let idx = 0; idx < maxima.length; idx++) {
      const target = model.getTargetValue(idx, state);
      expect(target).toBeGreaterThanOrEqual(0);
      expect(target).toBeLessThanOrEqual(maxima[idx]);
    }
  }
}

function expectLayoutInfo(
  model: LogicalModel,
  componentId: string,
  expected: { x: number; y: number; width: number; height: number }
): void {
  const component = model.getComponent(componentId);
  expect(component).toBeTruthy();

  const info = model.getLayout().getInfo(component as NodeInfo);
  expect(info).toBeTruthy();
  expect(info!.x).toBe(expected.x);
  expect(info!.y).toBe(expected.y);
  expect(info!.width).toBe(expected.width);
  expect(info!.height).toBe(expected.height);
}

describe("TestSBMLQualModels", () => {
  test("imports the minimal SBML-qual fixture with expected structure", async () => {
    const filename = TestHelper.getTestFilename("sbml_models", "minimal_example.sbml");
    const model = await LQMServiceManager.load(filename);

    expect(model.getComponents().map((node) => node.getNodeID())).toEqual([
      "p53",
      "Mdm2cyt",
      "Mdm2nuc",
      "DNAdam"
    ]);
    expect(model.getComponents().map((node) => node.getMax())).toEqual([2, 2, 1, 1]);
    expect(model.getComponents().every((node) => node.isInput() === false)).toBe(true);
    expect(model.hasExtraComponents()).toBe(false);
    expect(model.hasLayout()).toBe(true);
    expectLayoutInfo(model, "p53", { x: 160, y: 153, width: 75, height: 40 });
    expectLayoutInfo(model, "Mdm2cyt", { x: 164, y: 359, width: 75, height: 40 });
    expectLayoutInfo(model, "Mdm2nuc", { x: 472, y: 357, width: 75, height: 40 });
    expectLayoutInfo(model, "DNAdam", { x: 471, y: 149, width: 75, height: 40 });
    expectTargetsStayWithinBounds(model);
  });

  test("preserves logical behavior across SBML-qual export and re-import", async () => {
    const source = TestHelper.getTestFilename("sbml_models", "minimal_example.sbml");
    const saved = TestHelper.getTestOutput("sbml_models", "roundtrip_model.sbml");

    const original = await LQMServiceManager.load(source);
    expect(await LQMServiceManager.save(original, saved, "sbml")).toBe(true);
    expect(fs.existsSync(saved)).toBe(true);
    const exportedXml = fs.readFileSync(saved, "utf8");
    expect(exportedXml).toContain('xmlns:qual="http://www.sbml.org/sbml/level3/version1/qual/version1"');
    expect(exportedXml.match(/<qual:qualitativeSpecies\b/g)?.length).toBe(original.getComponents().length);
    expect(exportedXml.match(/<qual:transition\b/g)?.length).toBe(original.getComponents().length);

    const reloaded = await LQMServiceManager.load(saved);
    expectModelsEquivalent(original, reloaded);
  });
});

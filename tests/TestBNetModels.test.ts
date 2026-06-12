import * as fs from "fs";
import { LQMServiceManager } from "../src";
import { TestHelper } from "./TestHelper";

describe("TestBNetModels", () => {
  test("imports BoolNet models with header, comments, constants and repeated targets", async () => {
    const filename = TestHelper.getTestFilename("bnet_models", "simple_model.bnet");
    const model = await LQMServiceManager.load(filename);

    expect(model.getComponents().map((node) => node.getNodeID())).toEqual(["A", "B", "C"]);
    expect(model.getComponents().every((node) => node.getMax() === 1)).toBe(true);

    expect(model.getTargetValue(0, [0, 0, 0])).toBe(0);
    expect(model.getTargetValue(0, [0, 1, 0])).toBe(1);
    expect(model.getTargetValue(0, [0, 0, 1])).toBe(1);
    expect(model.getTargetValue(1, [0, 0, 0])).toBe(1);
    expect(model.getTargetValue(1, [0, 0, 1])).toBe(0);
    expect(model.getTargetValue(2, [0, 0, 0])).toBe(1);
    expect(model.getTargetValue(2, [1, 1, 1])).toBe(1);
  });

  test("preserves Boolean behavior across bnet export and re-import", async () => {
    const source = TestHelper.getTestFilename("bnet_models", "simple_model.bnet");
    const saved = TestHelper.getTestOutput("bnet_models", "roundtrip_model.bnet");

    const original = await LQMServiceManager.load(source);
    expect(await LQMServiceManager.save(original, saved, "bnet")).toBe(true);
    expect(fs.existsSync(saved)).toBe(true);

    const exported = fs.readFileSync(saved, "utf8");
    expect(exported).toContain("targets, factors");
    expect(exported).toContain("A, ");
    expect(exported).toContain("B, ");
    expect(exported).toContain("C, ");

    const reloaded = await LQMServiceManager.load(saved, "bnet");
    for (const state of [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 0],
      [0, 1, 1],
      [1, 0, 0],
      [1, 0, 1],
      [1, 1, 0],
      [1, 1, 1]
    ]) {
      for (let idx = 0; idx < original.getComponents().length; idx++) {
        expect(reloaded.getTargetValue(idx, state)).toBe(original.getTargetValue(idx, state));
      }
    }
  });
});

import { LQMServiceManager, NodeInfo, PatternValidator } from "../src";
import { TestHelper } from "./TestHelper";

describe("TestMetadataInSBML", () => {
  test("testMetadataManagement", async () => {
    const loadname = TestHelper.getTestFilename("sbml_models", "minimal_example.sbml");
    const savename = TestHelper.getTestOutput("sbml_models", "minimal_example_saved.sbml");
    const savename2 = TestHelper.getTestOutput("sbml_models", "minimal_example_saved_again.sbml");

    const model = await LQMServiceManager.load(loadname);
    const annot = model.getAnnotator();

    annot.onModel().openBlock("customQualifier");
    annot.annotate("#word1");
    annot.annotate("#word2");
    annot.annotate("key1=val11");
    annot.annotate("key1=value12");
    annot.annotate("key2=val21");

    annot.onModel().openBlock("is").annotate("doi:10.15252/msb.20199110");

    const ni = model.getComponent("p53");
    if (ni != null) {
      annot.node(ni).annotate("#output");
    }

    expect(await LQMServiceManager.save(model, savename, "sbml")).toBe(true);
    const model2 = await LQMServiceManager.load(savename);
    expect(model2).toBeTruthy();
    expect(await LQMServiceManager.save(model, savename2, "sbml")).toBe(true);
  });

  test("testMatching", () => {
    let tag = PatternValidator.asTag("#pipo");
    expect(tag.isPresent()).toBe(true);
    expect((tag as any).get()).toBe("pipo");

    tag = PatternValidator.asTag("tag:pipo");
    expect(tag.isPresent()).toBe(true);
    expect((tag as any).get()).toBe("pipo");

    expect(PatternValidator.asTag("tg:pipo").isPresent()).toBe(false);
    expect(PatternValidator.asTag("col:pipo").isPresent()).toBe(false);
    expect(PatternValidator.asTag("pipo").isPresent()).toBe(false);
  });
});

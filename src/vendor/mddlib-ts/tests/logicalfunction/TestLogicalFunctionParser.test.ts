import { FunctionNode, FunctionParser, MDDManager, OperandFactory, PathSearcher, SimpleOperandFactory } from "../../src";

function debug(
  parser: FunctionParser,
  opFactory: OperandFactory,
  functionText: string,
  nodeCount: number,
  solutionCount: number
): void {
  const f = parser.compile(opFactory, functionText)!;
  const ddFactory = opFactory.getMDDManager();
  const node = f.getMDD(ddFactory);

  expect(ddFactory.getNodeCount()).toBe(nodeCount);
  const searcher = new PathSearcher(ddFactory, 1);
  searcher.setNode(node);
  expect(searcher.countPaths()).toBe(solutionCount);
  ddFactory.free(node);
  expect(ddFactory.getNodeCount()).toBe(0);
}

describe("TestLogicalFunctionParser", () => {
  test("testLogicalFunction", () => {
    const operands: string[] = [];
    for (let i = 0; i < 8; i++) {
      operands.push(`var${i}`);
    }
    const opFactory = new SimpleOperandFactory<string>(operands);
    const parser = new FunctionParser();

    debug(parser, opFactory, "var1", 1, 1);
    debug(parser, opFactory, "!var1", 1, 1);
    debug(parser, opFactory, "var1 & (var2 & var3)", 3, 1);
    debug(parser, opFactory, "var1 | var5", 2, 2);
    debug(parser, opFactory, "var1 & (var2 & var3) & var4 | var5", 5, 5);
    debug(parser, opFactory, "var1 & (var2 & var3) & var4 | !var5", 5, 5);
    debug(parser, opFactory, "var1 & (var2 & var3) & var4 | var5 | (var6 & var7)", 7, 9);
  });
});

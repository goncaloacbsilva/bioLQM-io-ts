import { PathSearcher } from "../../../mddlib";
import { BaseExporter } from "../BaseExporter";

export class BNetExport extends BaseExporter {
  protected async export(): Promise<void> {
    const ddmanager = this.model.getMDDManager();
    const variables = ddmanager.getAllVariables();
    const searcher = new PathSearcher(ddmanager);
    const functions = this.model.getLogicalFunctions();
    const names = variables.map((variable) => String(variable.key));
    const width = names.reduce((max, name) => Math.max(max, name.length), 5);
    const sortedNames = [...names].sort((left, right) => left.localeCompare(right));

    let content = "";
    content += "# model in BoolNet format\n";
    content += "# the header targets, factors is mandatory to be importable in the R package BoolNet\n\n";
    content += "targets, factors\n";

    for (const name of sortedNames) {
      const idx = names.indexOf(name);
      const variable = variables[idx];
      const functionId = functions[idx];
      content += `${variable}, ${" ".repeat(width - name.length)}`;

      if (ddmanager.isleaf(functionId)) {
        content += `${functionId}\n`;
        continue;
      }

      const path = searcher.setNode(functionId);
      const clauses: string[] = [];
      for (const leaf of searcher) {
        if (leaf === 0) {
          continue;
        }

        const terms: string[] = [];
        for (let pathIdx = 0; pathIdx < path.length; pathIdx++) {
          const constraint = path[pathIdx];
          if (constraint < 0) {
            continue;
          }
          const regulator = String(variables[pathIdx].key);
          terms.push(constraint === 0 ? `!${regulator}` : regulator);
        }
        clauses.push(terms.join("&"));
      }

      content += `${clauses.join(" | ")}\n`;
    }

    const { writeTextToStream } = await import("../StreamProvider");
    await writeTextToStream(await this.streams!.output(), content);
  }
}

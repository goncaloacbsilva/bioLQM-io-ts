import { LogicalModel } from "../LogicalModel";
import { BNetFormat } from "../io/bnet/BNetFormat";
import { SBMLFormat } from "../io/sbml/SBMLFormat";

const sbmlFormat = new SBMLFormat();
const bnetFormat = new BNetFormat();
const formats = new Map<string, SBMLFormat | BNetFormat>([
  ["sbml", sbmlFormat],
  ["bnet", bnetFormat]
]);

export class LQMServiceManager {
  static load(filename: string, format?: string): Promise<LogicalModel> | LogicalModel {
    const selected = format ?? filename.substring(filename.lastIndexOf(".") + 1);
    const loader = formats.get(selected);
    if (loader == null) {
      throw new Error(`Format not found: ${selected}`);
    }
    return loader.load(filename);
  }

  static async save(model: LogicalModel, filename: string, format?: string): Promise<boolean> {
    const selected = format ?? filename.substring(filename.lastIndexOf(".") + 1);
    const exporter = formats.get(selected);
    if (exporter == null) {
      return false;
    }
    await exporter.export(model, filename);
    return true;
  }
}

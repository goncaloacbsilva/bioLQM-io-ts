import { LogicalModel } from "../LogicalModel";
import { SBMLFormat } from "../io/sbml/SBMLFormat";

const sbmlFormat = new SBMLFormat();

export class LQMServiceManager {
  static load(filename: string, format?: string): Promise<LogicalModel> | LogicalModel {
    const selected = format ?? filename.substring(filename.lastIndexOf(".") + 1);
    if (selected !== "sbml") {
      throw new Error(`Format not found: ${selected}`);
    }
    return sbmlFormat.load(filename);
  }

  static async save(model: LogicalModel, filename: string, format?: string): Promise<boolean> {
    const selected = format ?? filename.substring(filename.lastIndexOf(".") + 1);
    if (selected !== "sbml") {
      return false;
    }
    await sbmlFormat.export(model, filename);
    return true;
  }
}

import { LogicalModel } from "../../LogicalModel";
import { MultivaluedSupport } from "../../service/MultivaluedSupport";
import { AbstractFormat } from "../AbstractFormat";
import { BNetExport } from "./BNetExport";
import { BNetImport } from "./BNetImport";

export class BNetFormat extends AbstractFormat {
  constructor() {
    super("bnet", "bnet functions format", MultivaluedSupport.BOOLEANIZED);
  }

  getLoader(): BNetImport {
    return new BNetImport();
  }

  getExporter(model: LogicalModel): BNetExport {
    return new BNetExport(model);
  }
}

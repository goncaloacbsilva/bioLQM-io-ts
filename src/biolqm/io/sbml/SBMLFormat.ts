import { LogicalModel } from "../../LogicalModel";
import { AbstractFormat } from "../AbstractFormat";
import { MultivaluedSupport } from "../../service/MultivaluedSupport";
import { SBMLqualExport } from "./SBMLqualExport";
import { SBMLqualImport } from "./SBMLqualImport";

export class SBMLFormat extends AbstractFormat {
  constructor() {
    super("sbml", "SBML-qual v1.0 format", MultivaluedSupport.MULTIVALUED);
  }

  getLoader(): SBMLqualImport {
    return new SBMLqualImport();
  }

  getExporter(model: LogicalModel): SBMLqualExport {
    return new SBMLqualExport(model);
  }
}

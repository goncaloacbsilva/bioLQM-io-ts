import { Model } from "../../../_jsbml/Model";
import { SBMLDocument } from "../../../_jsbml/SBMLDocument";
import { LayoutModelPlugin } from "../../../_jsbml/ext/layout/LayoutModelPlugin";
import { QualModelPlugin } from "../../../_jsbml/ext/qual/QualModelPlugin";

export class SBMLQualBundle {
  constructor(
    public readonly document: SBMLDocument,
    public readonly model: Model,
    public readonly qmodel: QualModelPlugin,
    public readonly lmodel: LayoutModelPlugin | null = null
  ) {}
}

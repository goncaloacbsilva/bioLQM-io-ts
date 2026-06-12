import { Model } from "../../../_jsbml/Model";
import { SBMLDocument } from "../../../_jsbml/SBMLDocument";
import { LayoutConstants } from "../../../_jsbml/ext/layout/LayoutConstants";
import { LayoutModelPlugin } from "../../../_jsbml/ext/layout/LayoutModelPlugin";
import { QualConstants } from "../../../_jsbml/ext/qual/QualConstants";
import { QualModelPlugin } from "../../../_jsbml/ext/qual/QualModelPlugin";
import { SBMLReader } from "../../../_jsbml/xml/stax/SBMLReader";
import { SBMLQualBundle } from "./SBMLQualBundle";

export class SBMLqualHelper {
  static async parseInputStream(stream: ReadableStream<Uint8Array>): Promise<SBMLQualBundle> {
    const document = await new SBMLReader().readSBMLFromStream(stream as any);
    return this.getQualitativeModel(document);
  }

  static newBundle(addLayout = false): SBMLQualBundle {
    const sdoc = new SBMLDocument(3, 1);
    sdoc.addNamespace(QualConstants.shortLabel, "xmlns", QualConstants.namespaceURI);
    if (addLayout) {
      sdoc.addNamespace(LayoutConstants.shortLabel, "xmlns", LayoutConstants.namespaceURI);
    }

    const smodel = sdoc.createModel("model_id");
    const qmodel = new QualModelPlugin();
    smodel.addExtension(QualConstants.namespaceURI, qmodel);
    sdoc.getSBMLDocumentAttributes().set(`${QualConstants.shortLabel}:required`, "true");

    let lmodel: LayoutModelPlugin | null = null;
    if (addLayout) {
      lmodel = new LayoutModelPlugin();
      smodel.addExtension(LayoutConstants.namespaceURI, lmodel);
      sdoc.getSBMLDocumentAttributes().set(`${LayoutConstants.shortLabel}:required`, "false");
    }

    return new SBMLQualBundle(sdoc, smodel, qmodel, lmodel);
  }

  private static getQualitativeModel(sdoc: SBMLDocument): SBMLQualBundle {
    const smodel = sdoc.getModel();
    const qmodel = smodel.getExtension(QualConstants.namespaceURI) as QualModelPlugin;
    const lmodel = (smodel.getExtension(LayoutConstants.namespaceURI) as LayoutModelPlugin) ?? null;
    return new SBMLQualBundle(sdoc, smodel, qmodel, lmodel);
  }
}

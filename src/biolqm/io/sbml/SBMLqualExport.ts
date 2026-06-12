import {
  MDDManager,
  MDDVariable,
  PathSearcher,
  VariableEffect
} from "../../../mddlib";
import { Annotation as JSBMLAnnotation } from "../../../_jsbml/Annotation";
import { ASTNode, ASTNodeType } from "../../../_jsbml/ASTNode";
import { CVTerm } from "../../../_jsbml/CVTerm";
import { SBMLDocument } from "../../../_jsbml/SBMLDocument";
import { SBMLWriter } from "../../../_jsbml/SBMLWriter";
import { Compartment } from "../../../_jsbml/Compartment";
import { Layout } from "../../../_jsbml/ext/layout/Layout";
import { BoundingBox } from "../../../_jsbml/ext/layout/BoundingBox";
import { Dimensions } from "../../../_jsbml/ext/layout/Dimensions";
import { GeneralGlyph } from "../../../_jsbml/ext/layout/GeneralGlyph";
import { FunctionTerm } from "../../../_jsbml/ext/qual/FunctionTerm";
import { InputTransitionEffect } from "../../../_jsbml/ext/qual/InputTransitionEffect";
import { OutputTransitionEffect } from "../../../_jsbml/ext/qual/OutputTransitionEffect";
import { QualitativeSpecies } from "../../../_jsbml/ext/qual/QualitativeSpecies";
import { Sign } from "../../../_jsbml/ext/qual/Sign";
import { SBase } from "../../../_jsbml/SBase";
import { XMLNode } from "../../../_jsbml/xml/XMLNode";
import { ConnectivityMatrix } from "../../ConnectivityMatrix";
import { LogicalModel } from "../../LogicalModel";
import { ModelLayout } from "../../ModelLayout";
import { NodeInfo } from "../../NodeInfo";
import { Annotator } from "../../metadata/Annotator";
import { Pair } from "../../metadata/Pair";
import { URI } from "../../metadata/annotations/URI";
import { Qualifier } from "../../metadata/constants/Qualifier";
import { BaseExporter } from "../BaseExporter";
import { writeTextToStream } from "../StreamProvider";
import { SBMLQualBundle } from "./SBMLQualBundle";
import { SBMLqualHelper } from "./SBMLqualHelper";

export class SBMLqualExport extends BaseExporter {
  private readonly matrix: ConnectivityMatrix;
  private readonly ddmanager: MDDManager;
  private readonly annot: Annotator<NodeInfo>;
  private readonly qualBundle: SBMLQualBundle;
  private readonly coreNodes: NodeInfo[];
  private readonly searcher: PathSearcher;
  private readonly node2species = new Map<NodeInfo, QualitativeSpecies>();
  private readonly coreIDS: string[];
  private needFilled = true;
  private trPrefix = "tr_";

  constructor(model: LogicalModel, addLayout = model.hasLayout()) {
    super(model);
    this.ddmanager = model.getMDDManager();
    this.searcher = new PathSearcher(this.ddmanager, true as any);
    this.matrix = new ConnectivityMatrix(model);
    this.coreNodes = model.getComponents();
    this.annot = model.getAnnotator();
    this.coreIDS = model.getComponents().map((node) => node.getNodeID());
    this.qualBundle = SBMLqualHelper.newBundle(addLayout);
  }

  protected async export(): Promise<void> {
    const writer = new SBMLWriter();
    await writeTextToStream(await this.streams!.output(), writer.toXML(this.getSBMLDocument()));
  }

  getSBMLDocument(): SBMLDocument {
    return this.getSBMLBundle().document;
  }

  getSBMLBundle(): SBMLQualBundle {
    this.ensureFilled();
    return this.qualBundle;
  }

  private ensureTransitionPrefix(): void {
    for (const ni of this.coreNodes) {
      while (ni.getNodeID().startsWith(this.trPrefix)) {
        this.trPrefix += "_";
      }
    }
    for (const ni of this.model.getExtraComponents()) {
      while (ni.getNodeID().startsWith(this.trPrefix)) {
        this.trPrefix += "_";
      }
    }
  }

  private ensureFilled(): void {
    if (!this.needFilled) {
      return;
    }
    this.ensureTransitionPrefix();
    this.needFilled = false;

    const comp1 = this.qualBundle.model.createCompartment("comp1");
    comp1.setConstant(true);

    this.annot.onModel();
    this.exportElementMetadata(this.annot, this.qualBundle.document.getModel());

    this.exportNodes(comp1, this.model.getComponents(), this.model.getLogicalFunctions(), false);
    this.exportNodes(comp1, this.model.getExtraComponents(), this.model.getExtraLogicalFunctions(), true);

    if (this.model.hasLayout() && this.qualBundle.lmodel != null) {
      const mlayout = this.model.getLayout();
      const layout = new Layout();
      layout.setId("__layout__");
      this.qualBundle.lmodel.addLayout(layout);

      let width = 0;
      let height = 0;
      for (const ni of this.model.getComponents()) {
        const li = mlayout.getInfo(ni);
        if (li == null) {
          continue;
        }
        const glyph = new GeneralGlyph();
        const id = this.getSpecies(ni)!.getId();
        glyph.setReference(id);
        glyph.setId(`_ly_${id}`);
        const bb = new BoundingBox();
        const pos = bb.createPosition();
        pos.setX(li.x);
        pos.setY(li.y);
        const dim = bb.createDimensions();
        dim.setWidth(li.width);
        dim.setHeight(li.height);
        if (li.x + li.width > width) width = li.x + li.width;
        if (li.y + li.height > height) height = li.y + li.height;
        glyph.setBoundingBox(bb);
        layout.addGeneralGlyph(glyph);
      }
      const dims = new Dimensions();
      dims.setWidth(width);
      dims.setHeight(height);
      layout.setDimensions(dims);
    }
  }

  private exportNodes(comp1: Compartment, nodes: NodeInfo[], functions: number[], isExtra: boolean): void {
    for (const ni of nodes) {
      const sp = this.qualBundle.qmodel.createQualitativeSpecies(ni.getNodeID(), comp1);
      sp.setMaxLevel(ni.getMax());
      sp.setConstant(ni.isInput());
      const name = ni.getName();
      if (name != null && name.length > 0) {
        sp.setName(name);
      }
      this.node2species.set(ni, sp);
      this.annot.node(ni);
      this.exportElementMetadata(this.annot, sp);
    }

    for (let i = 0; i < functions.length; i++) {
      const ni = nodes[i];
      if (!ni.isInput()) {
        this.addTransition(ni, functions[i], this.matrix.getRegulators(i, isExtra));
      }
    }
  }

  setInitialCondition(state: number[]): void {
    this.ensureFilled();
    for (let idx = 0; idx < state.length; idx++) {
      const v = state[idx];
      if (v < 0) continue;
      const species = this.getSpecies(this.coreNodes[idx]);
      species?.setInitialLevel(v);
    }
  }

  getSpecies(ni: NodeInfo): QualitativeSpecies | undefined {
    return this.node2species.get(ni);
  }

  private addTransition(ni: NodeInfo, functionId: number, regulators: number[]): void {
    const trID = `${this.trPrefix}${ni.getNodeID()}`;
    const tr = this.qualBundle.qmodel.createTransition(`${trID}_`);
    tr.createOutput(`${trID}_out`, this.node2species.get(ni)!, OutputTransitionEffect.assignmentLevel);

    if (this.ddmanager.isleaf(functionId)) {
      const fterm = new FunctionTerm();
      fterm.setDefaultTerm(true);
      fterm.setResultLevel(functionId);
      tr.addFunctionTerm(fterm);
      return;
    }

    for (const idx of regulators) {
      const niReg = this.coreNodes[idx];
      const input = tr.createInput(
        `${trID}_in_${idx}`,
        this.node2species.get(niReg)!,
        InputTransitionEffect.none
      );

      let sign = Sign.unknown;
      const regVar = this.ddmanager.getVariableForKey(niReg)!;
      switch (this.ddmanager.getVariableEffect(regVar, functionId)) {
        case VariableEffect.DUAL:
          sign = Sign.dual;
          break;
        case VariableEffect.POSITIVE:
          sign = Sign.positive;
          break;
        case VariableEffect.NEGATIVE:
          sign = Sign.negative;
          break;
      }
      input.setSign(sign);

      this.annot.edge(new Pair(niReg, ni));
      this.exportElementMetadata(this.annot, input);
    }

    const defaultTerm = new FunctionTerm();
    defaultTerm.setDefaultTerm(true);
    defaultTerm.setResultLevel(0);
    tr.addFunctionTerm(defaultTerm);

    const orNodes = new Array<ASTNode | null>(ni.getMax() + 1).fill(null);
    const path = this.searcher.setNode(functionId);
    const tmax = this.searcher.getMax();
    for (const leaf of this.searcher) {
      if (leaf === 0) continue;

      let andNode = new ASTNode(ASTNodeType.LOGICAL_AND);
      for (let i = 0; i < path.length; i++) {
        const cst = path[i];
        if (cst < 0) continue;
        const max = tmax[i];

        if (max === cst) {
          const constraintNode = new ASTNode(ASTNodeType.RELATIONAL_EQ);
          constraintNode.addChild(new ASTNode(this.coreIDS[i]));
          constraintNode.addChild(new ASTNode(cst));
          andNode.addChild(constraintNode);
        } else {
          if (cst > 0) {
            const geq = new ASTNode(ASTNodeType.RELATIONAL_GEQ);
            geq.addChild(new ASTNode(this.coreIDS[i]));
            geq.addChild(new ASTNode(cst));
            andNode.addChild(geq);
          }
          if (max > 0) {
            const leq = new ASTNode(ASTNodeType.RELATIONAL_LEQ);
            leq.addChild(new ASTNode(this.coreIDS[i]));
            leq.addChild(new ASTNode(max));
            andNode.addChild(leq);
          }
        }
      }

      if (andNode.getChildCount() === 1) {
        andNode = andNode.getChild(0);
      }

      let orNode = orNodes[leaf];
      if (orNode == null) {
        orNodes[leaf] = andNode;
      } else {
        if (orNode.getType() !== ASTNodeType.LOGICAL_OR) {
          const oldOrNode = orNode;
          orNode = new ASTNode(ASTNodeType.LOGICAL_OR);
          orNode.addChild(oldOrNode);
          orNodes[leaf] = orNode;
        }
        orNode.addChild(andNode);
      }
    }

    for (let level = 1; level < orNodes.length; level++) {
      const math = orNodes[level];
      if (math == null) continue;
      const ft = new FunctionTerm();
      ft.setResultLevel(level);
      ft.setMath(math);
      tr.addFunctionTerm(ft);
    }
  }

  private exportCurrentAnnotation(annot: Annotator<NodeInfo>): JSBMLAnnotation | null {
    if (annot == null || !annot.hasData()) {
      return null;
    }
    const result = new JSBMLAnnotation();
    for (const a of annot.annotations() ?? []) {
      const cvterm = new CVTerm();
      cvterm.setQualifier(annot.isModel() ? CVTerm.Qualifier.BQM_UNKNOWN : CVTerm.Qualifier.BQB_UNKNOWN);
      if (a.qualifier != null) {
        cvterm.setUnknownQualifierName(a.qualifier.term);
      }
      for (const uri of a.uris) {
        cvterm.addResource(uri.uri());
      }
      for (const tag of a.tags) {
        cvterm.addResource(`tag:${tag}`);
      }
      for (const [key, value] of a.keyValues.entries()) {
        cvterm.addResource(`keyvalue:${key}=${value}`);
      }
      result.addCVTerm(cvterm);
    }
    return result;
  }

  private exportElementMetadata(annot: Annotator<NodeInfo>, element: SBase): void {
    const annotation = this.exportCurrentAnnotation(annot);
    if (annotation != null) {
      const history = annotation.getHistory();
      history.setModifiedDate(new Date());
      element.setMetaId(`meta_${element.getId()}`);
      element.setAnnotation(annotation);
    }

    const notes = annot.getNotes();
    if (notes != null) {
      element.setNotes(XMLNode.convertStringToXMLNode(`<notes><body xmlns="http://www.w3.org/1999/xhtml">${notes}</body></notes>`));
    }
  }
}

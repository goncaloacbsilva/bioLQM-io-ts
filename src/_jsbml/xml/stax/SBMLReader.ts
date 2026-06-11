import * as fs from "fs";
import { XMLParser } from "fast-xml-parser";
import { ASTNode, ASTNodeType } from "../../ASTNode";
import { Compartment } from "../../Compartment";
import { Model } from "../../Model";
import { SBMLDocument } from "../../SBMLDocument";
import { LayoutModelPlugin } from "../../ext/layout/LayoutModelPlugin";
import { LayoutConstants } from "../../ext/layout/LayoutConstants";
import { Layout } from "../../ext/layout/Layout";
import { GeneralGlyph } from "../../ext/layout/GeneralGlyph";
import { BoundingBox } from "../../ext/layout/BoundingBox";
import { QualConstants } from "../../ext/qual/QualConstants";
import { QualModelPlugin } from "../../ext/qual/QualModelPlugin";
import { OutputTransitionEffect } from "../../ext/qual/OutputTransitionEffect";
import { InputTransitionEffect } from "../../ext/qual/InputTransitionEffect";
import { Sign } from "../../ext/qual/Sign";
import { FunctionTerm } from "../../ext/qual/FunctionTerm";

function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function textValue(node: any): string {
  if (node == null) {
    return "";
  }
  if (typeof node === "string") {
    return node.trim();
  }
  return String(node["#text"] ?? "").trim();
}

function parseMath(node: any): ASTNode {
  if (node == null) {
    return new ASTNode(ASTNodeType.CONSTANT_FALSE);
  }
  if (node.apply != null) {
    const apply = node.apply;
    const opKey = Object.keys(apply).find((key) => !key.startsWith("@_") && key !== "ci" && key !== "cn" && key !== "apply");
    const opNode = apply[opKey!];
    let type = ASTNodeType.LOGICAL_AND;
    switch (opKey) {
      case "and":
        type = ASTNodeType.LOGICAL_AND;
        break;
      case "or":
        type = ASTNodeType.LOGICAL_OR;
        break;
      case "not":
        type = ASTNodeType.LOGICAL_NOT;
        break;
      case "eq":
        type = ASTNodeType.RELATIONAL_EQ;
        break;
      case "neq":
        type = ASTNodeType.RELATIONAL_NEQ;
        break;
      case "geq":
        type = ASTNodeType.RELATIONAL_GEQ;
        break;
      case "gt":
        type = ASTNodeType.RELATIONAL_GT;
        break;
      case "leq":
        type = ASTNodeType.RELATIONAL_LEQ;
        break;
      case "lt":
        type = ASTNodeType.RELATIONAL_LT;
        break;
    }
    const ast = new ASTNode(type);
    if (apply.ci != null) {
      ast.addChild(new ASTNode(textValue(apply.ci)));
    }
    if (apply.cn != null) {
      const cn = ensureArray(apply.cn);
      for (const child of cn) {
        ast.addChild(new ASTNode(Number.parseInt(textValue(child), 10)));
      }
    }
    if (apply.apply != null) {
      const nested = ensureArray(apply.apply);
      for (const child of nested) {
        ast.addChild(parseMath({ apply: child }));
      }
    }
    return ast;
  }
  return new ASTNode(ASTNodeType.CONSTANT_FALSE);
}

export class SBMLReader {
  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    preserveOrder: false,
    trimValues: false
  });

  readSBML(filePath: string): SBMLDocument {
    return this.parse(fs.readFileSync(filePath, "utf-8"));
  }

  async readSBMLFromStream(stream: fs.ReadStream): Promise<SBMLDocument> {
    const chunks: string[] = [];
    for await (const chunk of stream) {
      chunks.push(String(chunk));
    }
    return this.parse(chunks.join(""));
  }

  private parse(xml: string): SBMLDocument {
    const root = this.parser.parse(xml).sbml;
    const document = new SBMLDocument(Number(root["@_level"] ?? 3), Number(root["@_version"] ?? 1));
    const model = document.createModel(root.model?.["@_id"] ?? "model_id");
    if (root.model?.["@_metaid"]) {
      model.setMetaId(root.model["@_metaid"]);
    }

    const qualModel = new QualModelPlugin();
    model.addExtension(QualConstants.namespaceURI, qualModel);

    const layoutModel = new LayoutModelPlugin();
    model.addExtension(LayoutConstants.namespaceURI, layoutModel);

    for (const compartmentNode of ensureArray(root.model?.listOfCompartments?.compartment)) {
      const compartment = model.createCompartment(compartmentNode["@_id"]);
      compartment.setConstant(compartmentNode["@_constant"] === true || compartmentNode["@_constant"] === "true");
    }

    for (const speciesNode of ensureArray(root.model?.["qual:listOfQualitativeSpecies"]?.["qual:qualitativeSpecies"] ?? root.model?.listOfQualitativeSpecies?.qualitativeSpecies)) {
      const compartment = model.getListOfCompartments()[0] ?? new Compartment("comp1");
      const species = qualModel.createQualitativeSpecies(speciesNode["@_qual:id"] ?? speciesNode["@_id"], compartment);
      species.setCompartment(speciesNode["@_qual:compartment"] ?? speciesNode["@_compartment"] ?? "comp1");
      species.setConstant((speciesNode["@_qual:constant"] ?? speciesNode["@_constant"]) === "true" || (speciesNode["@_qual:constant"] ?? speciesNode["@_constant"]) === true);
      species.setMaxLevel(Number(speciesNode["@_qual:maxLevel"] ?? speciesNode["@_maxLevel"] ?? 1));
      if (speciesNode["@_qual:metaid"] ?? speciesNode["@_metaid"]) {
        species.setMetaId(speciesNode["@_qual:metaid"] ?? speciesNode["@_metaid"]);
      }
      if (speciesNode["@_qual:name"] ?? speciesNode["@_name"]) {
        species.setName(speciesNode["@_qual:name"] ?? speciesNode["@_name"]);
      }
    }

    for (const transitionNode of ensureArray(root.model?.["qual:listOfTransitions"]?.["qual:transition"] ?? root.model?.listOfTransitions?.transition)) {
      const transition = qualModel.createTransition(transitionNode["@_qual:id"] ?? transitionNode["@_id"]);

      for (const inputNode of ensureArray(transitionNode["qual:listOfInputs"]?.["qual:input"] ?? transitionNode.listOfInputs?.input)) {
        const species = qualModel.getListOfQualitativeSpecies().find((cur) => cur.getId() === (inputNode["@_qual:qualitativeSpecies"] ?? inputNode["@_qualitativeSpecies"]))!;
        const input = transition.createInput(
          inputNode["@_qual:id"] ?? inputNode["@_id"],
          species,
          InputTransitionEffect.none
        );
        input.setSign((inputNode["@_qual:sign"] ?? inputNode["@_sign"] ?? "unknown") as Sign);
        if (inputNode["@_qual:thresholdLevel"] ?? inputNode["@_thresholdLevel"]) {
          input.setThresholdLevel(Number(inputNode["@_qual:thresholdLevel"] ?? inputNode["@_thresholdLevel"]));
        }
      }

      for (const outputNode of ensureArray(transitionNode["qual:listOfOutputs"]?.["qual:output"] ?? transitionNode.listOfOutputs?.output)) {
        const species = qualModel.getListOfQualitativeSpecies().find((cur) => cur.getId() === (outputNode["@_qual:qualitativeSpecies"] ?? outputNode["@_qualitativeSpecies"]))!;
        transition.createOutput(
          outputNode["@_qual:id"] ?? outputNode["@_id"],
          species,
          OutputTransitionEffect.assignmentLevel
        );
      }

      const functionTermNodes = transitionNode["qual:listOfFunctionTerms"] ?? transitionNode.listOfFunctionTerms;
      for (const defaultNode of ensureArray(functionTermNodes?.["qual:defaultTerm"] ?? functionTermNodes?.defaultTerm)) {
        const term = new FunctionTerm();
        term.setDefaultTerm(true);
        term.setResultLevel(Number(defaultNode["@_qual:resultLevel"] ?? defaultNode["@_resultLevel"] ?? 0));
        transition.addFunctionTerm(term);
      }
      for (const functionNode of ensureArray(functionTermNodes?.["qual:functionTerm"] ?? functionTermNodes?.functionTerm)) {
        const term = new FunctionTerm();
        term.setResultLevel(Number(functionNode["@_qual:resultLevel"] ?? functionNode["@_resultLevel"] ?? 0));
        if (functionNode.math != null) {
          term.setMath(parseMath(functionNode.math));
        }
        transition.addFunctionTerm(term);
      }
    }

    for (const layoutNode of ensureArray(root.model?.["layout:listOfLayouts"]?.["layout:layout"])) {
      const layout = new Layout();
      layout.setId(layoutNode["@_layout:id"] ?? layoutNode["@_id"]);
      const dims = layoutNode["layout:dimensions"];
      if (dims) {
        const d = new (require("../../ext/layout/Dimensions").Dimensions)();
        d.setWidth(Number(dims["@_layout:width"] ?? dims["@_width"] ?? 0));
        d.setHeight(Number(dims["@_layout:height"] ?? dims["@_height"] ?? 0));
        layout.setDimensions(d);
      }
      const glyphNodes = ensureArray(layoutNode["layout:listOfAdditionalGraphicalObjects"]?.["layout:generalGlyph"]);
      for (const glyphNode of glyphNodes) {
        const glyph = new GeneralGlyph();
        glyph.setId(glyphNode["@_layout:id"] ?? glyphNode["@_id"]);
        glyph.setReference(glyphNode["@_layout:reference"] ?? glyphNode["@_reference"]);
        const bbNode = glyphNode["layout:boundingBox"];
        if (bbNode) {
          const bb = new BoundingBox();
          const pos = bb.createPosition();
          pos.setX(Number(bbNode["layout:position"]?.["@_layout:x"] ?? 0));
          pos.setY(Number(bbNode["layout:position"]?.["@_layout:y"] ?? 0));
          const dim = bb.createDimensions();
          dim.setWidth(Number(bbNode["layout:dimensions"]?.["@_layout:width"] ?? 0));
          dim.setHeight(Number(bbNode["layout:dimensions"]?.["@_layout:height"] ?? 0));
          glyph.setBoundingBox(bb);
        }
        layout.addGeneralGlyph(glyph);
      }
      layoutModel.addLayout(layout);
    }

    return document;
  }
}

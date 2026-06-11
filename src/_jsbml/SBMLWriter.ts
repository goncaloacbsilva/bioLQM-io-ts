import * as fs from "fs";
import { Annotation } from "./Annotation";
import { CVTerm } from "./CVTerm";
import { SBMLDocument } from "./SBMLDocument";
import { ASTNode, ASTNodeType } from "./ASTNode";
import { LayoutConstants } from "./ext/layout/LayoutConstants";
import { LayoutModelPlugin } from "./ext/layout/LayoutModelPlugin";
import { QualConstants } from "./ext/qual/QualConstants";
import { QualModelPlugin } from "./ext/qual/QualModelPlugin";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderMath(node: ASTNode): string {
  switch (node.getType()) {
    case ASTNodeType.NAME:
      return `<ci> ${esc(node.getName())} </ci>`;
    case ASTNodeType.INTEGER:
      return `<cn type="integer"> ${node.getInteger()} </cn>`;
    case ASTNodeType.CONSTANT_TRUE:
      return `<true/>`;
    case ASTNodeType.CONSTANT_FALSE:
      return `<false/>`;
    default: {
      const tagMap: Record<string, string> = {
        [ASTNodeType.LOGICAL_AND]: "and",
        [ASTNodeType.LOGICAL_OR]: "or",
        [ASTNodeType.LOGICAL_NOT]: "not",
        [ASTNodeType.RELATIONAL_EQ]: "eq",
        [ASTNodeType.RELATIONAL_NEQ]: "neq",
        [ASTNodeType.RELATIONAL_GEQ]: "geq",
        [ASTNodeType.RELATIONAL_GT]: "gt",
        [ASTNodeType.RELATIONAL_LEQ]: "leq",
        [ASTNodeType.RELATIONAL_LT]: "lt"
      };
      return `<apply><${tagMap[node.getType()]}/> ${node.getChildren().map(renderMath).join(" ")}</apply>`;
    }
  }
}

function renderAnnotation(annotation: Annotation, metaId: string, isModel: boolean): string {
  const cvTerms = annotation.getListOfCVTerms();
  if (cvTerms.length === 0) {
    return "";
  }

  const qualifierNS = isModel ? "bqmodel" : "bqbiol";
  const description = cvTerms
    .map((term) => {
      const name = term.getUnknownQualifierName() || "customQualifier";
      const resources = term.getResources()
        .map((resource) => `<rdf:li rdf:resource="${esc(resource)}"/>`)
        .join("");
      return `<${qualifierNS}:${name}><rdf:Bag>${resources}</rdf:Bag></${qualifierNS}:${name}>`;
    })
    .join("");

  return `<annotation><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:${qualifierNS}="http://biomodels.net/${isModel ? "model" : "biology"}-qualifiers/"><rdf:Description rdf:about="#${esc(metaId)}">${description}</rdf:Description></rdf:RDF></annotation>`;
}

export class SBMLWriter {
  write(document: SBMLDocument, output: fs.WriteStream): void {
    output.write(this.toXML(document));
    output.end();
  }

  toXML(document: SBMLDocument): string {
    const model = document.getModel();
    const qmodel = model.getExtension(QualConstants.namespaceURI) as QualModelPlugin;
    const lmodel = model.getExtension(LayoutConstants.namespaceURI) as LayoutModelPlugin | undefined;
    const attrs = Array.from(document.getSBMLDocumentAttributes().entries())
      .map(([key, value]) => `${key}="${esc(value)}"`)
      .join(" ");

    const modelMeta = model.isSetMetaId() ? ` metaid="${esc(model.getMetaId())}"` : "";
    const modelAnnotation = model.getAnnotation() ? renderAnnotation(model.getAnnotation()!, model.getMetaId(), true) : "";

    const layoutXML = lmodel && lmodel.getListOfLayouts().length > 0
      ? `<layout:listOfLayouts xmlns:layout="${LayoutConstants.namespaceURI}">${lmodel
          .getListOfLayouts()
          .map((layout) => {
            const dims = layout.getDimensions();
            const glyphs = layout
              .getListOfAdditionalGraphicalObjects()
              .map((glyph: any) => {
                const bb = glyph.getBoundingBox();
                const pos = bb.getPosition();
                const dim = bb.getDimensions();
                return `<layout:generalGlyph layout:id="${esc(glyph.getId())}" layout:reference="${esc(glyph.getReference())}"><layout:boundingBox><layout:position layout:x="${pos.getX()}" layout:y="${pos.getY()}"/><layout:dimensions layout:height="${dim.getHeight()}" layout:width="${dim.getWidth()}"/></layout:boundingBox></layout:generalGlyph>`;
              })
              .join("");
            return `<layout:layout layout:id="${esc(layout.getId())}"><layout:dimensions layout:height="${dims.getHeight()}" layout:width="${dims.getWidth()}"/><layout:listOfAdditionalGraphicalObjects>${glyphs}</layout:listOfAdditionalGraphicalObjects></layout:layout>`;
          })
          .join("")}</layout:listOfLayouts>`
      : "";

    const speciesXML = qmodel.getListOfQualitativeSpecies().map((species) => {
      const meta = species.isSetMetaId() ? ` metaid="${esc(species.getMetaId())}"` : "";
      const name = species.isSetName() ? ` qual:name="${esc(species.getName())}"` : "";
      const initial = species.getInitialLevel() != null ? ` qual:initialLevel="${species.getInitialLevel()}"` : "";
      const annotation = species.getAnnotation() ? renderAnnotation(species.getAnnotation()!, species.getMetaId(), false) : "";
      return `<qual:qualitativeSpecies${meta} qual:compartment="${esc(species.getCompartment())}" qual:constant="${species.getConstant()}" qual:id="${esc(species.getId())}" qual:maxLevel="${species.getMaxLevel()}"${name}${initial}>${annotation}</qual:qualitativeSpecies>`;
    }).join("");

    const transitionsXML = qmodel.getListOfTransitions().map((transition) => {
      const inputs = transition.getListOfInputs().map((input) => {
        const annotation = input.getAnnotation() ? renderAnnotation(input.getAnnotation()!, input.getMetaId(), false) : "";
        return `<qual:input qual:id="${esc(input.getId())}" qual:qualitativeSpecies="${esc(input.getQualitativeSpecies())}" qual:sign="${input.getSign()}" qual:transitionEffect="${input.getTransitionEffect()}">${annotation}</qual:input>`;
      }).join("");
      const outputs = transition.getListOfOutputs().map((output) => `<qual:output qual:id="${esc(output.getId())}" qual:qualitativeSpecies="${esc(output.getQualitativeSpecies())}" qual:transitionEffect="${output.getTransitionEffect()}"/>`).join("");
      const terms = transition.getListOfFunctionTerms().map((term) => {
        if (term.isDefaultTerm()) {
          return `<qual:defaultTerm qual:resultLevel="${term.getResultLevel()}"></qual:defaultTerm>`;
        }
        const math = term.getMath();
        return `<qual:functionTerm qual:resultLevel="${term.getResultLevel()}"><math xmlns="http://www.w3.org/1998/Math/MathML">${math ? renderMath(math) : ""}</math></qual:functionTerm>`;
      }).join("");
      return `<qual:transition qual:id="${esc(transition.getId())}"><qual:listOfInputs>${inputs}</qual:listOfInputs><qual:listOfOutputs>${outputs}</qual:listOfOutputs><qual:listOfFunctionTerms>${terms}</qual:listOfFunctionTerms></qual:transition>`;
    }).join("");

    const compartmentsXML = model.getListOfCompartments().map((compartment) => `<compartment constant="${compartment.getConstant()}" id="${esc(compartment.getId())}"/>`).join("");

    return `<?xml version='1.0' encoding='UTF-8' standalone='no'?>\n<sbml xmlns="http://www.sbml.org/sbml/level3/version1/core" level="${document.level}" version="${document.version}" xmlns:layout="${LayoutConstants.namespaceURI}" xmlns:qual="${QualConstants.namespaceURI}" ${attrs}><model id="${esc(model.getId())}"${modelMeta}>${modelAnnotation}${layoutXML}<qual:listOfQualitativeSpecies xmlns:qual="${QualConstants.namespaceURI}">${speciesXML}</qual:listOfQualitativeSpecies><qual:listOfTransitions xmlns:qual="${QualConstants.namespaceURI}">${transitionsXML}</qual:listOfTransitions><listOfCompartments>${compartmentsXML}</listOfCompartments></model></sbml>`;
  }
}

import {
  MDDBaseOperators,
  MDDManager,
  MDDManagerFactory,
  MDDOperator,
  MDDVariable,
  MDDVariableFactory
} from "mddlib-ts";
import { ASTNode, ASTNodeType } from "../../../_jsbml/ASTNode";
import { Layout } from "../../../_jsbml/ext/layout/Layout";
import { BoundingBox } from "../../../_jsbml/ext/layout/BoundingBox";
import { Dimensions } from "../../../_jsbml/ext/layout/Dimensions";
import { GeneralGlyph } from "../../../_jsbml/ext/layout/GeneralGlyph";
import { GraphicalObject } from "../../../_jsbml/ext/layout/GraphicalObject";
import { Point } from "../../../_jsbml/ext/layout/Point";
import { FunctionTerm } from "../../../_jsbml/ext/qual/FunctionTerm";
import { Input } from "../../../_jsbml/ext/qual/Input";
import { Output } from "../../../_jsbml/ext/qual/Output";
import { OutputTransitionEffect } from "../../../_jsbml/ext/qual/OutputTransitionEffect";
import { QualitativeSpecies } from "../../../_jsbml/ext/qual/QualitativeSpecies";
import { Transition } from "../../../_jsbml/ext/qual/Transition";
import { LogicalModel } from "../../LogicalModel";
import { LogicalModelImpl } from "../../LogicalModelImpl";
import { ModelLayout } from "../../ModelLayout";
import { NodeInfo } from "../../NodeInfo";
import { BaseLoader } from "../BaseLoader";
import { SBMLQualBundle } from "./SBMLQualBundle";
import { SBMLqualHelper } from "./SBMLqualHelper";

export class SBMLqualImport extends BaseLoader {
  private qualBundle: SBMLQualBundle | null = null;
  private identifier2index = new Map<string, number>();
  private ddvariables: MDDVariable[] = [];
  private readonly curInputs = new Map<string, Input>();

  getQualBundle(): SBMLQualBundle | null {
    return this.qualBundle;
  }

  protected async performTask(): Promise<LogicalModel> {
    this.qualBundle = await SBMLqualHelper.parseInputStream(await this.streams!.input());
    this.identifier2index = new Map();

    const variables = this.getVariables();
    const mvf = new MDDVariableFactory();
    for (const ni of variables) {
      mvf.add(ni, ni.getMax() + 1);
    }
    const ddmanager = MDDManagerFactory.getManager(mvf as any, 10);
    this.ddvariables = ddmanager.getAllVariables();
    const functions = new Array<number>(variables.length).fill(0);

    for (const tr of this.qualBundle.qmodel.getListOfTransitions()) {
      this.curInputs.clear();
      for (const input of tr.getListOfInputs()) {
        const inputID = input.getId();
        if (inputID != null) {
          this.curInputs.set(inputID, input);
        }
      }

      let defaultValue = 0;
      for (const ft of tr.getListOfFunctionTerms()) {
        if (ft.isDefaultTerm()) {
          defaultValue = ft.getResultLevel();
          break;
        }
      }

      let mdd = defaultValue;
      for (const ft of tr.getListOfFunctionTerms()) {
        const value = ft.getResultLevel();
        if (value === defaultValue) {
          continue;
        }
        const math = ft.getMath();
        if (math == null) {
          continue;
        }
        const f = this.getMDDForMathML(ddmanager, math, value);
        mdd = MDDBaseOperators.OR.combine(ddmanager, mdd, f);
      }

      for (const output of tr.getListOfOutputs()) {
        if (output.getTransitionEffect() !== OutputTransitionEffect.assignmentLevel) {
          throw new Error("Only handles assignement functions");
        }
        const idx = this.getIndexForName(output.getQualitativeSpecies());
        const ni = variables[idx];
        if (ni.isInput()) {
          throw new Error("Constants can not be used as transition output");
        }
        functions[idx] = mdd;
      }
    }

    let idx = 0;
    for (const ni of variables) {
      if (ni.isInput()) {
        const variable = ddmanager.getVariableForKey(ni)!;
        const max = ni.getMax();
        if (max === 1) {
          functions[idx] = variable.getNode(0, 1);
        } else {
          const values = Array.from({ length: max + 1 }, (_, i) => i);
          functions[idx] = variable.getNode(values);
        }
      }
      idx++;
    }

    const model = new LogicalModelImpl(variables, ddmanager, functions);

    if (this.qualBundle.lmodel != null) {
      const layouts = this.qualBundle.lmodel.getListOfLayouts();
      if (layouts.length > 0) {
        const llayout = model.getLayout();
        const layout = layouts[0];
        for (const graphics of layout.getListOfAdditionalGraphicalObjects()) {
          if (!(graphics instanceof GeneralGlyph)) {
            continue;
          }
          const sid = graphics.getReference();
          const ni = model.getComponent(sid);
          if (ni == null || !graphics.isSetBoundingBox()) {
            continue;
          }
          const bb = graphics.getBoundingBox();
          if (bb.isSetPosition()) {
            const pos = bb.getPosition();
            const li = llayout.setPosition(ni, pos.getX(), pos.getY());
            if (bb.isSetDimensions()) {
              const dim = bb.getDimensions();
              li.width = dim.getWidth();
              li.height = dim.getHeight();
            }
          }
        }
      }
    }

    return model;
  }

  private getVariables(): NodeInfo[] {
    const variables: NodeInfo[] = [];
    let curIndex = 0;
    for (const sp of this.qualBundle!.qmodel.getListOfQualitativeSpecies()) {
      let spid = sp.getId();
      if (spid.startsWith("s_")) {
        spid = spid.substring(2);
      }
      const name = sp.isSetName() ? sp.getName() : null;
      const max = sp.isSetMaxLevel() ? sp.getMaxLevel() : -1;
      const ni = new NodeInfo(spid, name ?? "", max);
      if (sp.isSetConstant() && sp.getConstant()) {
        ni.setInput(true);
      }
      variables.push(ni);
      this.identifier2index.set(sp.getId(), curIndex++);
    }
    this.guessMaxs(variables);
    return variables;
  }

  private guessMaxs(variables: NodeInfo[]): void {
    const needMax = new Array<boolean>(variables.length).fill(false);
    const maxs = new Array<number>(variables.length).fill(1);
    let allDefined = true;
    for (let i = 0; i < variables.length; i++) {
      const max = variables[i].getMax();
      maxs[i] = max;
      if (max < 0) {
        needMax[i] = true;
        maxs[i] = 1;
        allDefined = false;
      }
    }
    if (allDefined) {
      return;
    }
    for (const tr of this.qualBundle!.qmodel.getListOfTransitions()) {
      for (const output of tr.getListOfOutputs()) {
        const idx = this.getIndexForName(output.getQualitativeSpecies());
        if (!needMax[idx] || output.getTransitionEffect() !== OutputTransitionEffect.assignmentLevel) {
          continue;
        }
        let max = maxs[idx];
        for (const ft of tr.getListOfFunctionTerms()) {
          const value = ft.getResultLevel();
          if (value > max) {
            max = value;
          }
        }
        maxs[idx] = max;
      }
    }
    for (let i = 0; i < variables.length; i++) {
      if (needMax[i]) {
        variables[i].setMax(maxs[i]);
      }
    }
  }

  getIndexForName(name: string): number {
    const index = this.identifier2index.get(name);
    if (index == null) {
      throw new Error(`Could not find ID: ${name}`);
    }
    return index;
  }

  private getMDDForMathML(ddmanager: MDDManager, math: ASTNode, value: number): number {
    let type = math.getType();
    switch (type) {
      case ASTNodeType.NAME: {
        let name = math.getName().trim();
        let threshold = 1;
        const input = this.curInputs.get(name);
        if (input != null) {
          name = input.getQualitativeSpecies().trim();
          threshold = input.getThresholdLevel();
        }
        if (threshold < 1) {
          return value;
        }
        const index = this.getIndexForName(name);
        const variable = this.ddvariables[index];
        if (threshold >= variable.nbval) {
          throw new Error(`Invalid threshold in ${input}`);
        }
        if (variable.nbval === 2) {
          return variable.getNode(0, value);
        }
        const children = new Array<number>(variable.nbval).fill(0);
        for (let i = threshold; i < variable.nbval; i++) {
          children[i] = value;
        }
        return variable.getNode(children);
      }
      case ASTNodeType.RELATIONAL_GEQ:
      case ASTNodeType.RELATIONAL_GT:
      case ASTNodeType.RELATIONAL_LEQ:
      case ASTNodeType.RELATIONAL_LT:
      case ASTNodeType.RELATIONAL_NEQ:
      case ASTNodeType.RELATIONAL_EQ:
        return this.getMDDForRelation(math, value);
      case ASTNodeType.CONSTANT_FALSE:
        return 0;
      case ASTNodeType.CONSTANT_TRUE:
        return value;
      case ASTNodeType.LOGICAL_NOT: {
        const child = math.getChild(0);
        const mdd = this.getMDDForMathML(ddmanager, child, value);
        return ddmanager.not(mdd);
      }
      default:
        break;
    }

    let op: MDDOperator;
    switch (type) {
      case ASTNodeType.LOGICAL_AND:
        op = MDDBaseOperators.AND;
        break;
      case ASTNodeType.LOGICAL_OR:
        op = MDDBaseOperators.OR;
        break;
      default:
        throw new Error(`TODO: support MathML node for: ${type}`);
    }

    const children = math.getChildren();
    const childrenFunctions = children.map((child) => this.getMDDForMathML(ddmanager, child, value));
    switch (childrenFunctions.length) {
      case 0:
        throw new Error("Logical operation without children");
      case 1:
        return childrenFunctions[0];
      case 2:
        return op.combine(ddmanager, childrenFunctions[0], childrenFunctions[1]);
      default:
        return op.combine(ddmanager, childrenFunctions);
    }
  }

  private getMDDForRelation(relation: ASTNode, value: number): number {
    let type = relation.getType();
    const varNode = relation.getChild(0);
    const valueNode = relation.getChild(1);

    let varName = varNode.getName().trim();
    let relValue: number | null = null;
    let reversed = false;

    if (varNode.getType() === ASTNodeType.NAME && valueNode.getType() === ASTNodeType.INTEGER) {
      relValue = valueNode.getInteger();
    } else if (varNode.getType() === ASTNodeType.INTEGER && valueNode.getType() === ASTNodeType.NAME) {
      reversed = true;
      varName = valueNode.getName().trim();
      relValue = varNode.getInteger();
    }

    if (relValue == null) {
      throw new Error("Could not find a value in relation");
    }

    if (reversed) {
      switch (type) {
        case ASTNodeType.RELATIONAL_GEQ:
          type = ASTNodeType.RELATIONAL_LEQ;
          break;
        case ASTNodeType.RELATIONAL_LEQ:
          type = ASTNodeType.RELATIONAL_GEQ;
          break;
        case ASTNodeType.RELATIONAL_GT:
          type = ASTNodeType.RELATIONAL_LT;
          break;
        case ASTNodeType.RELATIONAL_LT:
          type = ASTNodeType.RELATIONAL_GT;
          break;
      }
    }

    const index = this.getIndexForName(varName);
    const variable = this.ddvariables[index];

    switch (type) {
      case ASTNodeType.RELATIONAL_GT:
        type = ASTNodeType.RELATIONAL_GEQ;
        relValue += 1;
      case ASTNodeType.RELATIONAL_GEQ:
        if (relValue <= 0) return value;
        if (relValue >= variable.nbval) return 0;
        break;
      case ASTNodeType.RELATIONAL_LEQ:
        type = ASTNodeType.RELATIONAL_LT;
        relValue += 1;
      case ASTNodeType.RELATIONAL_LT:
        if (relValue >= variable.nbval) return value;
        if (relValue <= 0) return 0;
        break;
      case ASTNodeType.RELATIONAL_NEQ:
        if (relValue < 0 || relValue >= variable.nbval) return value;
        break;
      case ASTNodeType.RELATIONAL_EQ:
        if (relValue < 0 || relValue >= variable.nbval) return 0;
        break;
    }

    if (variable.nbval === 2) {
      switch (type) {
        case ASTNodeType.RELATIONAL_LT:
          return variable.getNode(value, 0);
        case ASTNodeType.RELATIONAL_GEQ:
          return variable.getNode(0, value);
        case ASTNodeType.RELATIONAL_EQ:
          return relValue === 0 ? variable.getNode(value, 0) : variable.getNode(0, value);
        case ASTNodeType.RELATIONAL_NEQ:
          return relValue === 0 ? variable.getNode(0, value) : variable.getNode(value, 0);
      }
    }

    const values = new Array<number>(variable.nbval).fill(0);
    switch (type) {
      case ASTNodeType.RELATIONAL_GEQ:
        for (let v = relValue; v < variable.nbval; v++) values[v] = value;
        return variable.getNode(values);
      case ASTNodeType.RELATIONAL_LT:
        for (let v = 0; v < relValue; v++) values[v] = value;
        return variable.getNode(values);
      case ASTNodeType.RELATIONAL_NEQ:
        for (let v = 0; v < variable.nbval; v++) values[v] = v === relValue ? 0 : value;
        return variable.getNode(values);
      case ASTNodeType.RELATIONAL_EQ:
        values[relValue] = value;
        return variable.getNode(values);
      default:
        throw new Error("Could not handle relation");
    }
  }
}

import { SBase } from "../../SBase";
import { FunctionTerm } from "./FunctionTerm";
import { Input } from "./Input";
import { InputTransitionEffect } from "./InputTransitionEffect";
import { Output } from "./Output";
import { OutputTransitionEffect } from "./OutputTransitionEffect";
import { QualitativeSpecies } from "./QualitativeSpecies";

export class Transition extends SBase {
  private readonly inputs: Input[] = [];
  private readonly outputs: Output[] = [];
  private readonly functionTerms: FunctionTerm[] = [];

  createInput(id: string, species: QualitativeSpecies, effect: InputTransitionEffect): Input {
    const input = new Input(id, species, effect);
    this.inputs.push(input);
    return input;
  }

  createOutput(id: string, species: QualitativeSpecies, effect: OutputTransitionEffect): Output {
    const output = new Output(id, species, effect);
    this.outputs.push(output);
    return output;
  }

  addFunctionTerm(term: FunctionTerm): void {
    this.functionTerms.push(term);
  }

  getListOfInputs(): Input[] {
    return this.inputs;
  }

  getListOfOutputs(): Output[] {
    return this.outputs;
  }

  getListOfFunctionTerms(): FunctionTerm[] {
    return this.functionTerms;
  }
}

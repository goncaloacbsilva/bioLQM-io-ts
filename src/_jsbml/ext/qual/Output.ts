import { SBase } from "../../SBase";
import { OutputTransitionEffect } from "./OutputTransitionEffect";
import { QualitativeSpecies } from "./QualitativeSpecies";

export class Output extends SBase {
  private qualitativeSpecies = "";
  private transitionEffect = OutputTransitionEffect.assignmentLevel;

  constructor(id: string, species: QualitativeSpecies, effect: OutputTransitionEffect) {
    super(id);
    this.qualitativeSpecies = species.getId();
    this.transitionEffect = effect;
  }

  getQualitativeSpecies(): string {
    return this.qualitativeSpecies;
  }

  getTransitionEffect(): OutputTransitionEffect {
    return this.transitionEffect;
  }
}

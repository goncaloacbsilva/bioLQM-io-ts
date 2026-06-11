import { SBase } from "../../SBase";
import { InputTransitionEffect } from "./InputTransitionEffect";
import { QualitativeSpecies } from "./QualitativeSpecies";
import { Sign } from "./Sign";

export class Input extends SBase {
  private qualitativeSpecies = "";
  private sign = Sign.unknown;
  private transitionEffect = InputTransitionEffect.none;
  private thresholdLevel = 1;

  constructor(id: string, species: QualitativeSpecies, effect: InputTransitionEffect) {
    super(id);
    this.qualitativeSpecies = species.getId();
    this.transitionEffect = effect;
  }

  getQualitativeSpecies(): string {
    return this.qualitativeSpecies;
  }

  setSign(sign: Sign): void {
    this.sign = sign;
  }

  getSign(): Sign {
    return this.sign;
  }

  getTransitionEffect(): InputTransitionEffect {
    return this.transitionEffect;
  }

  setThresholdLevel(level: number): void {
    this.thresholdLevel = level;
  }

  getThresholdLevel(): number {
    return this.thresholdLevel;
  }
}

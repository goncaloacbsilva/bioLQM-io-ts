import { Compartment } from "../../Compartment";
import { InputTransitionEffect } from "./InputTransitionEffect";
import { OutputTransitionEffect } from "./OutputTransitionEffect";
import { QualitativeSpecies } from "./QualitativeSpecies";
import { Transition } from "./Transition";

export class QualModelPlugin {
  private readonly species: QualitativeSpecies[] = [];
  private readonly transitions: Transition[] = [];

  createQualitativeSpecies(id: string, compartment: Compartment): QualitativeSpecies {
    const species = new QualitativeSpecies(id, compartment);
    this.species.push(species);
    return species;
  }

  createTransition(id: string): Transition {
    const transition = new Transition(id);
    this.transitions.push(transition);
    return transition;
  }

  getListOfQualitativeSpecies(): QualitativeSpecies[] {
    return this.species;
  }

  getListOfTransitions(): Transition[] {
    return this.transitions;
  }
}

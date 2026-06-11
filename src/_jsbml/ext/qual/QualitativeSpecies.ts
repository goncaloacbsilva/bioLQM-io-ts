import { Compartment } from "../../Compartment";
import { SBase } from "../../SBase";

export class QualitativeSpecies extends SBase {
  private maxLevel = 0;
  private compartment = "";
  private constant = false;
  private initialLevel: number | null = null;

  constructor(id: string, compartment?: Compartment) {
    super(id);
    if (compartment != null) {
      this.compartment = compartment.getId();
    }
  }

  setMaxLevel(maxLevel: number): void {
    this.maxLevel = maxLevel;
  }

  getMaxLevel(): number {
    return this.maxLevel;
  }

  isSetMaxLevel(): boolean {
    return true;
  }

  setCompartment(compartment: string): void {
    this.compartment = compartment;
  }

  getCompartment(): string {
    return this.compartment;
  }

  setConstant(constant: boolean): void {
    this.constant = constant;
  }

  getConstant(): boolean {
    return this.constant;
  }

  isSetConstant(): boolean {
    return true;
  }

  setInitialLevel(level: number): void {
    this.initialLevel = level;
  }

  getInitialLevel(): number | null {
    return this.initialLevel;
  }
}

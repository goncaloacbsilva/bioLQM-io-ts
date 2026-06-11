import { SBase } from "./SBase";

export class Compartment extends SBase {
  private constant = false;

  setConstant(value: boolean): void {
    this.constant = value;
  }

  getConstant(): boolean {
    return this.constant;
  }
}

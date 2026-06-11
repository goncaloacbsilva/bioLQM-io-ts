import { GraphicalObject } from "./GraphicalObject";

export class GeneralGlyph extends GraphicalObject {
  private reference = "";

  setReference(reference: string): void {
    this.reference = reference;
  }

  getReference(): string {
    return this.reference;
  }
}

import { SBase } from "../../SBase";
import { Dimensions } from "./Dimensions";
import { GeneralGlyph } from "./GeneralGlyph";
import { GraphicalObject } from "./GraphicalObject";

export class Layout extends SBase {
  private dimensions: Dimensions | null = null;
  private readonly additionalGraphicalObjects: GraphicalObject[] = [];

  addGeneralGlyph(glyph: GeneralGlyph): void {
    this.additionalGraphicalObjects.push(glyph);
  }

  getListOfAdditionalGraphicalObjects(): GraphicalObject[] {
    return this.additionalGraphicalObjects;
  }

  setDimensions(dimensions: Dimensions): void {
    this.dimensions = dimensions;
  }

  getDimensions(): Dimensions {
    return this.dimensions!;
  }
}

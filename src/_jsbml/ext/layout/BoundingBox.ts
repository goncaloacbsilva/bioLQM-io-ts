import { Dimensions } from "./Dimensions";
import { Point } from "./Point";

export class BoundingBox {
  private position: Point | null = null;
  private dimensions: Dimensions | null = null;

  createPosition(): Point {
    this.position = new Point();
    return this.position;
  }

  createDimensions(): Dimensions {
    this.dimensions = new Dimensions();
    return this.dimensions;
  }

  getPosition(): Point {
    return this.position!;
  }

  getDimensions(): Dimensions {
    return this.dimensions!;
  }

  isSetPosition(): boolean {
    return this.position != null;
  }

  isSetDimensions(): boolean {
    return this.dimensions != null;
  }
}

import { SBase } from "../../SBase";
import { BoundingBox } from "./BoundingBox";

export class GraphicalObject extends SBase {
  private boundingBox: BoundingBox | null = null;

  setBoundingBox(bb: BoundingBox): void {
    this.boundingBox = bb;
  }

  getBoundingBox(): BoundingBox {
    return this.boundingBox!;
  }

  isSetBoundingBox(): boolean {
    return this.boundingBox != null;
  }
}

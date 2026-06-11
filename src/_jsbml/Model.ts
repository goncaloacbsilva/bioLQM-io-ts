import { Compartment } from "./Compartment";
import { SBase } from "./SBase";

export class Model extends SBase {
  private readonly compartments: Compartment[] = [];
  private readonly extensions = new Map<string, unknown>();

  createCompartment(id: string): Compartment {
    const compartment = new Compartment(id);
    this.compartments.push(compartment);
    return compartment;
  }

  getListOfCompartments(): Compartment[] {
    return this.compartments;
  }

  addExtension(namespaceURI: string, plugin: unknown): void {
    this.extensions.set(namespaceURI, plugin);
  }

  getExtension(namespaceURI: string): unknown {
    return this.extensions.get(namespaceURI);
  }
}

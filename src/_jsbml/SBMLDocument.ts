import { Model } from "./Model";

export class SBMLDocument {
  private model: Model | null = null;
  private readonly namespaces = new Map<string, string>();
  private readonly attrs = new Map<string, string>();

  constructor(
    public readonly level: number,
    public readonly version: number
  ) {}

  addNamespace(shortLabel: string, _xmlns: string, namespaceURI: string): void {
    this.namespaces.set(shortLabel, namespaceURI);
  }

  getNamespaces(): Map<string, string> {
    return this.namespaces;
  }

  getSBMLDocumentAttributes(): Map<string, string> {
    return this.attrs;
  }

  createModel(id: string): Model {
    this.model = new Model(id);
    return this.model;
  }

  getModel(): Model {
    if (this.model == null) {
      throw new Error("No model");
    }
    return this.model;
  }
}

export enum CVQualifier {
  BQB_UNKNOWN = "BQB_UNKNOWN",
  BQM_UNKNOWN = "BQM_UNKNOWN"
}

export class CVTerm {
  private qualifier: CVQualifier = CVQualifier.BQB_UNKNOWN;
  private unknownQualifierName = "";
  private readonly resources: string[] = [];

  setQualifier(qualifier: CVQualifier): void {
    this.qualifier = qualifier;
  }

  getQualifier(): CVQualifier {
    return this.qualifier;
  }

  setUnknownQualifierName(name: string): void {
    this.unknownQualifierName = name;
  }

  getUnknownQualifierName(): string {
    return this.unknownQualifierName;
  }

  addResource(resource: string): void {
    this.resources.push(resource);
  }

  getResources(): string[] {
    return this.resources;
  }

  static Qualifier = {
    BQB_UNKNOWN: CVQualifier.BQB_UNKNOWN,
    BQM_UNKNOWN: CVQualifier.BQM_UNKNOWN,
    getModelQualifierFor(_term: string): CVQualifier {
      return CVQualifier.BQM_UNKNOWN;
    },
    getBiologicalQualifierFor(_term: string): CVQualifier {
      return CVQualifier.BQB_UNKNOWN;
    }
  };
}

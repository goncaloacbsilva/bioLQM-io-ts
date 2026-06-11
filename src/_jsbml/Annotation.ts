import { CVTerm } from "./CVTerm";
import { History } from "./History";

export class Annotation {
  private readonly cvTerms: CVTerm[] = [];
  private readonly history = new History();

  addCVTerm(term: CVTerm): void {
    this.cvTerms.push(term);
  }

  getListOfCVTerms(): CVTerm[] {
    return this.cvTerms;
  }

  getHistory(): History {
    return this.history;
  }
}

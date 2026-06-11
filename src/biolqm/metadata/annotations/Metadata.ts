import { Annotation } from "./Annotation";
import { Qualifier } from "../constants/Qualifier";

export class Metadata {
  private readonly annotationList: Annotation[] = [];
  private notes: string | null = null;

  isEmpty(): boolean {
    return this.annotationList.length === 0 && (!this.notes || this.notes.length === 0);
  }

  getNotes(): string | null {
    return this.notes;
  }

  setNotes(notes: string | null): void {
    this.notes = notes;
  }

  annotations(): Annotation[] {
    return this.annotationList;
  }

  ensureAnnotation(qualifier: Qualifier | null): Annotation {
    for (const annotation of this.annotationList) {
      const cur = annotation.qualifier?.term ?? null;
      const wanted = qualifier?.term ?? null;
      if (cur === wanted) {
        return annotation;
      }
    }
    const created = new Annotation(qualifier);
    this.annotationList.push(created);
    return created;
  }
}

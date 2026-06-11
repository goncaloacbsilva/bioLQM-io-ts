import { Annotation } from "./Annotation";
import { XMLNode } from "./xml/XMLNode";

export class SBase {
  private id = "";
  private metaId = "";
  private annotation: Annotation | null = null;
  private notes: XMLNode | null = null;
  private name = "";

  constructor(id = "") {
    this.id = id;
  }

  getId(): string {
    return this.id;
  }

  setId(id: string): void {
    this.id = id;
  }

  setMetaId(metaId: string): void {
    this.metaId = metaId;
  }

  getMetaId(): string {
    return this.metaId;
  }

  isSetMetaId(): boolean {
    return this.metaId.length > 0;
  }

  setAnnotation(annotation: Annotation): void {
    this.annotation = annotation;
  }

  getAnnotation(): Annotation | null {
    return this.annotation;
  }

  isSetAnnotation(): boolean {
    return this.annotation != null;
  }

  setNotes(notes: XMLNode): void {
    this.notes = notes;
  }

  getNotes(): XMLNode | null {
    return this.notes;
  }

  isSetNotes(): boolean {
    return this.notes != null;
  }

  setName(name: string): void {
    this.name = name;
  }

  getName(): string {
    return this.name;
  }

  isSetName(): boolean {
    return this.name.length > 0;
  }
}

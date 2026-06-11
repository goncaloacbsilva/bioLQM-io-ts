import { AnnotationModule } from "./AnnotationModule";
import { AnnotationTarget } from "./AnnotationTarget";
import { Annotation } from "./annotations/Annotation";
import { Metadata } from "./annotations/Metadata";
import { URI } from "./annotations/URI";
import { Pair } from "./Pair";
import { PatternValidator } from "./validations/PatternValidator";

export class Annotator<N> {
  private target = AnnotationTarget.Model;
  private selected: object | null = null;
  private curMetadata: Metadata | null = null;
  private idxAnnotation = 0;

  constructor(private readonly mod: AnnotationModule) {}

  private getMetadata(): Metadata | null {
    return this.mod.getAnnotation(this.selected);
  }

  private ensureMetadata(): Metadata {
    if (this.curMetadata == null) {
      this.curMetadata = this.mod.ensureMetadata(this.selected);
    }
    return this.curMetadata;
  }

  private setSelection(target: AnnotationTarget, selected: object | null): this {
    this.target = target;
    this.selected = selected;
    this.curMetadata = this.mod.getAnnotation(selected);
    this.idxAnnotation = 0;
    return this;
  }

  onModel(): this {
    return this.setSelection(AnnotationTarget.Model, null);
  }

  node(node: N | null): this {
    return node == null ? this.onModel() : this.setSelection(AnnotationTarget.Component, node as object);
  }

  edge(src: N, tgt: N): this;
  edge(edge: Pair<N>): this;
  edge(arg1: N | Pair<N>, arg2?: N): this {
    const edge = arg1 instanceof Pair ? arg1 : new Pair(arg1, arg2 as N);
    return this.setSelection(AnnotationTarget.Interaction, edge);
  }

  openBlock(qualifier: string): this {
    const qualified = this.mod.ensureQualifier(this.target, qualifier);
    const annotations = this.ensureMetadata().annotations();
    annotations.push(new Annotation(qualified));
    this.idxAnnotation = annotations.length - 1;
    return this;
  }

  private getSelectedAnnotation(): Annotation | null {
    const annotations = this.annotations();
    if (annotations == null || this.idxAnnotation >= annotations.length) {
      return null;
    }
    return annotations[this.idxAnnotation];
  }

  private ensureAnnotation(): Annotation {
    const selected = this.getSelectedAnnotation();
    if (selected != null) {
      return selected;
    }
    return this.ensureMetadata().ensureAnnotation(null);
  }

  annotate(s: string): boolean {
    const tag = PatternValidator.asTag(s);
    if (tag.isPresent()) {
      const value = (tag as { get(): string }).get();
      if (this.ensureAnnotation().tags.add(value)) {
        this.mod.useTag(value);
      }
      return true;
    }

    const kv = PatternValidator.asKeyValue(s);
    if (kv != null) {
      if (this.ensureAnnotation().addKeyValue(kv.key, kv.value)) {
        this.mod.useKey(kv.key);
      }
      return true;
    }

    const entry = PatternValidator.asCollectionEntry(s);
    if (entry != null) {
      const collection = this.mod.getCollection(entry.key);
      if (collection == null) {
        if (this.ensureAnnotation().addKeyValue(entry.key, entry.value)) {
          this.mod.useKey(entry.key);
        }
      } else {
        this.ensureAnnotation().uris.push(new URI(collection, entry.value));
      }
      return true;
    }

    return false;
  }

  annotations(): Annotation[] | null {
    return this.getMetadata()?.annotations() ?? null;
  }

  getNotes(): string | null {
    return this.getMetadata()?.getNotes() ?? null;
  }

  setNotes(notes: string): void {
    this.ensureMetadata().setNotes(notes);
  }

  isModel(): boolean {
    return this.selected == null;
  }

  hasData(): boolean {
    const metadata = this.getMetadata();
    return metadata != null && !metadata.isEmpty();
  }
}

import { Collection } from "./constants/Collection";
import { Qualifier } from "./constants/Qualifier";
import { AnnotationTarget } from "./AnnotationTarget";
import { Metadata } from "./annotations/Metadata";

export class AnnotationModule {
  private modelMetadata: Metadata | null = null;
  private readonly annotations = new Map<object, Metadata>();
  private readonly qualifiers = new Map<string, Qualifier>();
  private readonly collections = new Map<string, Collection>();
  private readonly tags = new Set<string>();
  private readonly keys = new Set<string>();

  constructor() {
    this.collections.set("doi", new Collection("doi", "", false, true));
    this.collections.set("uniprot", new Collection("uniprot", "", false, true));
  }

  isEmpty(): boolean {
    return this.modelMetadata == null && this.annotations.size === 0;
  }

  getAnnotation(selected: object | null): Metadata | null {
    if (selected == null) {
      return this.modelMetadata;
    }
    return this.annotations.get(selected) ?? null;
  }

  ensureMetadata(selected: object | null): Metadata {
    if (selected == null) {
      if (this.modelMetadata == null) {
        this.modelMetadata = new Metadata();
      }
      return this.modelMetadata;
    }

    let metadata = this.annotations.get(selected);
    if (metadata == null) {
      metadata = new Metadata();
      this.annotations.set(selected, metadata);
    }
    return metadata;
  }

  ensureQualifier(_target: AnnotationTarget, qualifier: string | null): Qualifier | null {
    if (qualifier == null || qualifier.trim().length === 0) {
      return null;
    }
    let existing = this.qualifiers.get(qualifier);
    if (existing == null) {
      existing = new Qualifier(qualifier);
      this.qualifiers.set(qualifier, existing);
    }
    return existing;
  }

  useTag(tag: string): void {
    this.tags.add(tag);
  }

  useKey(key: string): void {
    this.keys.add(key);
  }

  getCollection(col: string): Collection | null {
    return this.collections.get(col) ?? null;
  }
}

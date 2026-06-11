import { Qualifier } from "../constants/Qualifier";
import { URI } from "./URI";

export class Annotation {
  readonly uris: URI[] = [];
  readonly tags = new Set<string>();
  readonly keyValues = new Map<string, string>();

  constructor(public readonly qualifier: Qualifier | null) {}

  addKeyValue(key: string, value: string | null): boolean {
    if (value == null) {
      return this.keyValues.delete(key);
    }
    const old = this.keyValues.get(key);
    this.keyValues.set(key, value);
    return old !== value;
  }

  isEmpty(): boolean {
    return this.uris.length === 0 && this.tags.size === 0 && this.keyValues.size === 0;
  }
}

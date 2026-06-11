import { Collection } from "../constants/Collection";

export class URI {
  constructor(
    private readonly collection: Collection | null,
    private readonly value: string
  ) {}

  getCollection(): Collection | null {
    return this.collection;
  }

  getValue(): string {
    return this.value;
  }

  matches(col: string | null, value: string | null): boolean {
    if ((this.collection == null && col != null) || (this.collection != null && this.collection.name !== col)) {
      return false;
    }
    return value == null ? this.value == null : value === this.value;
  }

  uri(): string {
    if (this.collection == null) {
      return this.value;
    }
    return `${this.collection.name}:${this.value}`;
  }
}

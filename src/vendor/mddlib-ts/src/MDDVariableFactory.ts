export class MDDVariableFactory implements Iterable<unknown> {
  private readonly keys: unknown[] = [];
  private readonly values = new Map<unknown, number>();

  add(key: unknown, nbvalues?: number): boolean {
    if (nbvalues == null) {
      this.keys.push(key);
      return true;
    }

    if (nbvalues < 2) {
      return false;
    }

    this.keys.push(key);
    if (nbvalues > 2) {
      this.values.set(key, nbvalues);
    }
    return true;
  }

  size(): number {
    return this.keys.length;
  }

  getNbValue(key: unknown): number {
    return this.values.get(key) ?? 2;
  }

  [Symbol.iterator](): Iterator<unknown> {
    return this.keys[Symbol.iterator]();
  }
}

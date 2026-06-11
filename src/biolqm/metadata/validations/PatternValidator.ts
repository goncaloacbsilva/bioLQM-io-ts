export class PatternValidator {
  private static readonly TAG = /^(?:#|tag:)([a-zA-Z][a-zA-Z0-9]*)$/;
  private static readonly KEYVAL = /^(?:keyvalue:)?([a-zA-Z][a-zA-Z0-9]*)=([a-zA-Z0-9]+)$/;
  private static readonly COLLECTION = /^([a-zA-Z][a-zA-Z0-9]*):(.+)$/;

  static asTag(s: string | null): { isPresent(): boolean; get(): string } | { isPresent(): boolean } {
    if (s == null || s.trim().length === 0) {
      return { isPresent: () => false };
    }
    const match = s.match(this.TAG);
    if (match) {
      return { isPresent: () => true, get: () => match[1] };
    }
    return { isPresent: () => false };
  }

  static asKeyValue(s: string | null): { key: string; value: string } | null {
    if (s == null || s.trim().length === 0) {
      return null;
    }
    const match = s.match(this.KEYVAL);
    return match ? { key: match[1], value: match[2] } : null;
  }

  static asCollectionEntry(s: string | null): { key: string; value: string } | null {
    if (s == null || s.trim().length === 0) {
      return null;
    }
    const match = s.match(this.COLLECTION);
    return match ? { key: match[1], value: match[2] } : null;
  }
}

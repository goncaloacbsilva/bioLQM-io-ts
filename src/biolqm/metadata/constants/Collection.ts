export class Collection {
  constructor(
    public readonly name: string,
    public readonly pattern: string,
    public readonly namespaceEmbedded: boolean,
    public readonly original: boolean
  ) {}

  getLink(value: string): string {
    return `https://identifiers.org/${this.name}/${value}`;
  }
}

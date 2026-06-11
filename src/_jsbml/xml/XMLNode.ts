export class XMLNode {
  constructor(private xml: string) {}

  static convertStringToXMLNode(xml: string): XMLNode {
    return new XMLNode(xml);
  }

  toXMLString(): string {
    return this.xml;
  }

  clearNamespaces(): void {}

  getChildElements(_a: string, _b: string): XMLNode[] {
    return [];
  }
}

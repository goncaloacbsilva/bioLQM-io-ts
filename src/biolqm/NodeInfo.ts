export class NodeInfo {
  static readonly UNDEFINED_MAX = -1;

  private name: string;
  private isInputFlag = false;
  private booleanizedGroup: NodeInfo[] | null = null;

  constructor(
    private nodeID: string,
    name = "",
    private max: number = 1
  ) {
    this.name = name?.trim() ?? "";
  }

  getNodeID(): string {
    return this.nodeID;
  }

  setNodeID(id: string): void {
    this.nodeID = id;
  }

  getName(): string {
    return this.name;
  }

  setName(name: string | null): void {
    this.name = name?.trim() ?? "";
  }

  getMax(): number {
    return this.max;
  }

  setMax(max: number): void {
    this.max = max;
  }

  isInput(): boolean {
    return this.isInputFlag;
  }

  setInput(isInput: boolean): void {
    this.isInputFlag = isInput;
  }

  getDisplayName(): string {
    return this.name.length > 0 ? this.name : this.nodeID;
  }

  getBooleanizedGroup(): NodeInfo[] | null {
    return this.booleanizedGroup;
  }

  setBooleanizedGroup(booleanizedGroup: NodeInfo[] | null): void {
    this.booleanizedGroup = booleanizedGroup;
  }

  clone(): NodeInfo {
    const clone = new NodeInfo(this.nodeID, this.name, this.max);
    clone.setInput(this.isInputFlag);
    return clone;
  }

  equals(other: unknown): boolean {
    return (
      other instanceof NodeInfo &&
      this.nodeID === other.nodeID &&
      this.max === other.max &&
      this.isInputFlag === other.isInputFlag
    );
  }

  toString(): string {
    return this.nodeID;
  }
}

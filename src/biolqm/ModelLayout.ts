import { NodeInfo } from "./NodeInfo";

export class LayoutInfo {
  constructor(
    public x: number,
    public y: number,
    public width = 0,
    public height = 0
  ) {}
}

export class ModelLayout {
  private readonly layout = new Map<NodeInfo, LayoutInfo>();

  getInfo(node: NodeInfo): LayoutInfo | undefined {
    return this.layout.get(node);
  }

  setPosition(node: NodeInfo, x: number, y: number): LayoutInfo {
    let info = this.layout.get(node);
    if (info == null) {
      info = new LayoutInfo(x, y);
      this.layout.set(node, info);
      return info;
    }
    info.x = x;
    info.y = y;
    return info;
  }

  set(node: NodeInfo, x: number, y: number, width: number, height: number): this {
    let info = this.layout.get(node);
    if (info == null) {
      info = new LayoutInfo(x, y, width, height);
      this.layout.set(node, info);
      return this;
    }
    info.x = x;
    info.y = y;
    info.width = width;
    info.height = height;
    return this;
  }

  copy(node: NodeInfo, source?: LayoutInfo): this {
    if (source == null) {
      this.layout.delete(node);
      return this;
    }
    return this.set(node, source.x, source.y, source.width, source.height);
  }
}

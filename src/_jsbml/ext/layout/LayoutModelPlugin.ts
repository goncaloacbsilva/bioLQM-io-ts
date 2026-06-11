import { Layout } from "./Layout";

export class LayoutModelPlugin {
  private readonly layouts: Layout[] = [];

  addLayout(layout: Layout): void {
    this.layouts.push(layout);
  }

  getListOfLayouts(): Layout[] {
    return this.layouts;
  }
}

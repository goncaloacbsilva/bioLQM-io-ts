import { BaseService } from "../service/BaseService";
import { MultivaluedSupport } from "../service/MultivaluedSupport";
import { LogicalModel } from "../LogicalModel";
import { LogicalModelFormat } from "./LogicalModelFormat";
import { StreamProvider } from "./StreamProvider";

export abstract class AbstractFormat extends BaseService implements LogicalModelFormat {
  constructor(id: string, name: string, modelType: MultivaluedSupport) {
    super(id, null, name, "", modelType);
  }

  canExport(): boolean {
    return true;
  }

  canLoad(): boolean {
    return true;
  }

  abstract getLoader(): import("./ModelLoader").ModelLoader;
  abstract getExporter(model: import("../LogicalModel").LogicalModel): import("./ModelExporter").ModelExporter;

  async loadFromProvider(source: StreamProvider): Promise<LogicalModel> {
    const loader = this.getLoader();
    loader.setSource(source);
    return await loader.call();
  }

  async load(source: string): Promise<LogicalModel> {
    const { createNodeFileStreamProvider } = await import("./NodeFileStreamProvider");
    return this.loadFromProvider(createNodeFileStreamProvider(source));
  }

  async exportToProvider(model: LogicalModel, destination: StreamProvider): Promise<void> {
    const exporter = this.getExporter(model);
    exporter.setDestination(destination);
    await exporter.call();
  }

  async export(model: LogicalModel, filename: string): Promise<void> {
    const { createNodeFileStreamProvider } = await import("./NodeFileStreamProvider");
    await this.exportToProvider(model, createNodeFileStreamProvider(filename));
  }
}

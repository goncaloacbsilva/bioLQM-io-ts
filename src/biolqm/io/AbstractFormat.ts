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

  async load(source: string): Promise<LogicalModel> {
    const loader = this.getLoader();
    loader.setSource(StreamProvider.create(source));
    return await loader.call();
  }

  async export(model: LogicalModel, filename: string): Promise<void> {
    const exporter = this.getExporter(model);
    exporter.setDestination(StreamProvider.create(filename));
    await exporter.call();
  }
}

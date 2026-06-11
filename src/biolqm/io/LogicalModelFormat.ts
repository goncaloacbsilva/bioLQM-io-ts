import { LogicalModel } from "../LogicalModel";
import { Service } from "../service/Service";
import { ModelExporter } from "./ModelExporter";
import { ModelLoader } from "./ModelLoader";
import { StreamProvider } from "./StreamProvider";

export interface LogicalModelFormat extends Service {
  canExport(): boolean;
  canLoad(): boolean;
  getLoader(): ModelLoader;
  getExporter(model: LogicalModel): ModelExporter;
  load(source: string): Promise<LogicalModel> | LogicalModel;
  export(model: LogicalModel, filename: string): Promise<void> | void;
}

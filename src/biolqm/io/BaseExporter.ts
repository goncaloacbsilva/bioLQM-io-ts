import { AbstractTask } from "../../common/task/AbstractTask";
import { LogicalModel } from "../LogicalModel";
import { ModelExporter } from "./ModelExporter";
import { StreamProvider } from "./StreamProvider";

export abstract class BaseExporter extends AbstractTask<boolean> implements ModelExporter {
  protected streams: StreamProvider | null = null;

  constructor(protected readonly model: LogicalModel) {
    super();
  }

  setDestination(streams: StreamProvider): void {
    this.streams = streams;
  }

  protected async performTask(): Promise<boolean> {
    await this.export();
    return true;
  }

  protected abstract export(): Promise<void> | void;
}

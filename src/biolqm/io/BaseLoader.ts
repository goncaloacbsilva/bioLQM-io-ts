import { AbstractTask } from "../../common/task/AbstractTask";
import { LogicalModel } from "../LogicalModel";
import { ModelLoader } from "./ModelLoader";
import { StreamProvider } from "./StreamProvider";

export abstract class BaseLoader extends AbstractTask<LogicalModel> implements ModelLoader {
  protected streams: StreamProvider | null = null;

  setSource(streams: StreamProvider): void {
    this.streams = streams;
  }
}

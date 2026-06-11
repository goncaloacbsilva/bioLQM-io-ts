import { LogicalModel } from "../LogicalModel";
import { StreamProvider as StreamProviderType } from "./StreamProvider";

export interface ModelLoader {
  setSource(streams: StreamProviderType): void;
  call(): Promise<LogicalModel> | LogicalModel;
}

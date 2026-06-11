import { StreamProvider as StreamProviderType } from "./StreamProvider";

export interface ModelExporter {
  setDestination(streams: StreamProviderType): void;
  call(): Promise<boolean> | boolean;
}

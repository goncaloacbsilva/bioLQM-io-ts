import type { MDDManager } from "./MDDManager";
import { MDDVariableFactory } from "./MDDVariableFactory";
import { MDDStoreImpl } from "./internal/MDDStoreImpl";

export class MDDManagerFactory {
  static getManager(vbuilder: MDDVariableFactory | unknown[], nbleaves: number): MDDManager {
    return new MDDStoreImpl(vbuilder, nbleaves);
  }
}

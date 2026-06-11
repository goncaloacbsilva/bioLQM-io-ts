import { MultivaluedSupport } from "./MultivaluedSupport";

export interface Service {
  getID(): string;
  getAliases(): string[] | null;
  getName(): string;
  getDescription(): string;
  getMultivaluedSupport(): MultivaluedSupport;
}

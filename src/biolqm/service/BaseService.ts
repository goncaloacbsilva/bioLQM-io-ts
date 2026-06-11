import { MultivaluedSupport } from "./MultivaluedSupport";
import { Service } from "./Service";

export class BaseService implements Service {
  constructor(
    private readonly id: string,
    private readonly aliases: string[] | null,
    private readonly name: string,
    private readonly descr: string,
    private readonly mvsupport: MultivaluedSupport
  ) {}

  getID(): string {
    return this.id;
  }

  getAliases(): string[] | null {
    return this.aliases;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.descr;
  }

  getMultivaluedSupport(): MultivaluedSupport {
    return this.mvsupport;
  }
}

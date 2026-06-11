export class Qualifier {
  constructor(
    public readonly term: string,
    public readonly synonym: string | null = null,
    public readonly definition: string | null = null
  ) {}
}

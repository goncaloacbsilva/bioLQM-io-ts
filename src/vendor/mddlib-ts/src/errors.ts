export class ParseException extends Error {
  readonly errorOffset: number;

  constructor(message: string, errorOffset: number) {
    super(message);
    this.name = "ParseException";
    this.errorOffset = errorOffset;
  }
}

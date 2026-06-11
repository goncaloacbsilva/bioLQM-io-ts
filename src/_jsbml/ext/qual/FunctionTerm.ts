import { ASTNode } from "../../ASTNode";

export class FunctionTerm {
  private defaultTerm = false;
  private resultLevel = 0;
  private math: ASTNode | null = null;

  setDefaultTerm(defaultTerm: boolean): void {
    this.defaultTerm = defaultTerm;
  }

  isDefaultTerm(): boolean {
    return this.defaultTerm;
  }

  setResultLevel(level: number): void {
    this.resultLevel = level;
  }

  getResultLevel(): number {
    return this.resultLevel;
  }

  setMath(math: ASTNode): void {
    this.math = math;
  }

  getMath(): ASTNode | null {
    return this.math;
  }
}

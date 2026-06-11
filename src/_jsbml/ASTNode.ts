export enum ASTNodeType {
  NAME = "NAME",
  INTEGER = "INTEGER",
  RELATIONAL_GEQ = "RELATIONAL_GEQ",
  RELATIONAL_GT = "RELATIONAL_GT",
  RELATIONAL_LEQ = "RELATIONAL_LEQ",
  RELATIONAL_LT = "RELATIONAL_LT",
  RELATIONAL_NEQ = "RELATIONAL_NEQ",
  RELATIONAL_EQ = "RELATIONAL_EQ",
  CONSTANT_FALSE = "CONSTANT_FALSE",
  CONSTANT_TRUE = "CONSTANT_TRUE",
  LOGICAL_NOT = "LOGICAL_NOT",
  LOGICAL_AND = "LOGICAL_AND",
  LOGICAL_OR = "LOGICAL_OR"
}

export class ASTNode {
  static Type = ASTNodeType;
  private readonly children: ASTNode[] = [];
  private type: ASTNodeType;
  private name = "";
  private integer = 0;

  constructor(type: ASTNodeType | string | number) {
    if (typeof type === "string" && !(type in ASTNodeType)) {
      this.type = ASTNodeType.NAME;
      this.name = type;
      return;
    }
    if (typeof type === "number") {
      this.type = ASTNodeType.INTEGER;
      this.integer = type;
      return;
    }
    this.type = type as ASTNodeType;
  }

  addChild(child: ASTNode): void {
    this.children.push(child);
  }

  getChild(idx: number): ASTNode {
    return this.children[idx];
  }

  getChildCount(): number {
    return this.children.length;
  }

  getChildren(): ASTNode[] {
    return this.children;
  }

  getType(): ASTNodeType {
    return this.type;
  }

  getName(): string {
    return this.name;
  }

  getInteger(): number {
    return this.integer;
  }
}

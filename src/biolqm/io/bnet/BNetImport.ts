import { FunctionNode, MDDBaseOperators, MDDManager, MDDOperator, SimpleOperandFactory, ValueNode } from "../../../mddlib";
import { BaseLoader } from "../BaseLoader";
import { readTextFromStream } from "../StreamProvider";
import { LogicalModelImpl } from "../../LogicalModelImpl";
import { NodeInfo } from "../../NodeInfo";

const HEADER = "targets, factors";
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

type Token =
  | { type: "identifier"; value: string }
  | { type: "value"; value: 0 | 1 }
  | { type: "not" | "and" | "or" | "lparen" | "rparen" };

export class BNetImport extends BaseLoader {
  protected async performTask(): Promise<LogicalModelImpl> {
    const source = await readTextFromStream(await this.streams!.input());
    const assignments = this.parseAssignments(source);
    const nodes: NodeInfo[] = [];
    const idToNode = new Map<string, NodeInfo>();

    for (const { target } of assignments) {
      if (!idToNode.has(target)) {
        const node = new NodeInfo(target);
        idToNode.set(target, node);
        nodes.push(node);
      }
    }

    const operandFactory = new SimpleOperandFactory<NodeInfo>(nodes);
    const functions = new Map<NodeInfo, FunctionNode>();
    for (const { target, expression } of assignments) {
      const node = idToNode.get(target)!;
      const parsed = this.parseExpression(expression, operandFactory);
      const current = functions.get(node);
      functions.set(node, current == null ? parsed : new OrNode(current, parsed));
    }

    const ddmanager = operandFactory.getMDDManager();
    const modelFunctions = nodes.map((node) => functions.get(node)?.getMDD(ddmanager) ?? 0);
    return new LogicalModelImpl(nodes, ddmanager, modelFunctions);
  }

  private parseAssignments(source: string): Array<{ target: string; expression: string }> {
    const assignments: Array<{ target: string; expression: string }> = [];
    let headerSeen = false;

    for (const rawLine of source.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (line === "" || line.startsWith("#")) {
        continue;
      }
      if (!headerSeen && line === HEADER) {
        headerSeen = true;
        continue;
      }

      const commaIndex = line.indexOf(",");
      if (commaIndex < 0) {
        throw new Error(`Invalid bnet assignment: ${rawLine}`);
      }

      const target = line.slice(0, commaIndex).trim();
      const expression = line.slice(commaIndex + 1).trim();
      if (!IDENTIFIER.test(target)) {
        throw new Error(`Invalid bnet target identifier: ${target}`);
      }
      if (expression === "") {
        throw new Error(`Missing expression for target: ${target}`);
      }
      assignments.push({ target, expression });
    }

    if (assignments.length === 0) {
      throw new Error("No bnet assignments found");
    }
    return assignments;
  }

  private parseExpression(expression: string, operandFactory: SimpleOperandFactory<NodeInfo>): FunctionNode {
    const tokens = tokenize(expression);
    const parser = new BNetExpressionParser(tokens, operandFactory);
    return parser.parse();
  }
}

class BNetExpressionParser {
  private idx = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly operandFactory: SimpleOperandFactory<NodeInfo>
  ) {}

  parse(): FunctionNode {
    const expression = this.parseOr();
    if (this.peek() != null) {
      throw new Error(`Unexpected token at end of expression: ${describeToken(this.peek()!)}`);
    }
    return expression;
  }

  private parseOr(): FunctionNode {
    let left = this.parseAnd();
    while (this.match("or")) {
      left = new OrNode(left, this.parseAnd());
    }
    return left;
  }

  private parseAnd(): FunctionNode {
    let left = this.parseUnary();
    while (this.match("and")) {
      left = new AndNode(left, this.parseUnary());
    }
    return left;
  }

  private parseUnary(): FunctionNode {
    if (this.match("not")) {
      return new NotNode(this.parseUnary());
    }
    return this.parsePrimary();
  }

  private parsePrimary(): FunctionNode {
    const token = this.peek();
    if (token == null) {
      throw new Error("Unexpected end of expression");
    }

    if (token.type === "identifier") {
      this.idx++;
      const operand = this.operandFactory.createOperand(token.value);
      if (operand == null) {
        throw new Error(`Unknown operand: ${token.value}`);
      }
      return operand;
    }

    if (token.type === "value") {
      this.idx++;
      return token.value === 0 ? ValueNode.FALSE : ValueNode.TRUE;
    }

    if (this.match("lparen")) {
      const expression = this.parseOr();
      if (!this.match("rparen")) {
        throw new Error("Missing closing parenthesis");
      }
      return expression;
    }

    throw new Error(`Unexpected token in expression: ${describeToken(token)}`);
  }

  private match(type: Token["type"]): boolean {
    if (this.peek()?.type === type) {
      this.idx++;
      return true;
    }
    return false;
  }

  private peek(): Token | undefined {
    return this.tokens[this.idx];
  }
}

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let idx = 0;

  while (idx < expression.length) {
    const char = expression[idx];
    if (/\s/.test(char)) {
      idx++;
      continue;
    }
    if (char === "!") {
      tokens.push({ type: "not" });
      idx++;
      continue;
    }
    if (char === "&") {
      tokens.push({ type: "and" });
      idx++;
      continue;
    }
    if (char === "|") {
      tokens.push({ type: "or" });
      idx++;
      continue;
    }
    if (char === "(") {
      tokens.push({ type: "lparen" });
      idx++;
      continue;
    }
    if (char === ")") {
      tokens.push({ type: "rparen" });
      idx++;
      continue;
    }

    const match = expression.slice(idx).match(/^[A-Za-z_][A-Za-z0-9_]*|^[01]/);
    if (match == null) {
      throw new Error(`Invalid token in expression: ${expression.slice(idx)}`);
    }

    const value = match[0];
    if (value === "0" || value === "1") {
      tokens.push({ type: "value", value: value === "0" ? 0 : 1 });
    } else if (/^(true|false)$/i.test(value)) {
      tokens.push({ type: "value", value: /^true$/i.test(value) ? 1 : 0 });
    } else {
      tokens.push({ type: "identifier", value });
    }
    idx += value.length;
  }

  return tokens;
}

function describeToken(token: Token): string {
  switch (token.type) {
    case "identifier":
      return token.value;
    case "value":
      return String(token.value);
    default:
      return token.type;
  }
}

abstract class BinaryNode implements FunctionNode {
  constructor(
    protected readonly left: FunctionNode,
    protected readonly right: FunctionNode
  ) {}

  isLeaf(): boolean {
    return false;
  }

  toString(par: boolean): string {
    const text = `${this.left.toString(true)} ${this.getSymbol()} ${this.right.toString(true)}`;
    return par ? `(${text})` : text;
  }

  getMDD(ddmanager: MDDManager): number {
    const left = this.left.getMDD(ddmanager);
    const right = this.right.getMDD(ddmanager);
    const combined = this.getOperation().combine(ddmanager, left, right);
    ddmanager.free(left);
    ddmanager.free(right);
    return combined;
  }

  protected abstract getSymbol(): string;
  protected abstract getOperation(): MDDOperator;
}

class AndNode extends BinaryNode {
  protected getSymbol(): string {
    return "&";
  }

  protected getOperation(): MDDOperator {
    return MDDBaseOperators.AND;
  }
}

class OrNode extends BinaryNode {
  protected getSymbol(): string {
    return "|";
  }

  protected getOperation(): MDDOperator {
    return MDDBaseOperators.OR;
  }
}

class NotNode implements FunctionNode {
  constructor(private readonly arg: FunctionNode) {}

  isLeaf(): boolean {
    return false;
  }

  toString(par: boolean): string {
    const text = `!${this.arg.toString(true)}`;
    return par ? `(${text})` : text;
  }

  getMDD(ddmanager: MDDManager): number {
    const arg = this.arg.getMDD(ddmanager);
    const result = ddmanager.not(arg);
    ddmanager.free(arg);
    return result;
  }
}

import * as fs from "fs";
import * as path from "path";

const resourceFolder = path.join(__dirname, "resources");
const outputFolder = path.join(__dirname, "test-output");

if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

export class TestHelper {
  static getTestFilename(dirname: string, filename: string): string {
    const dir = path.join(resourceFolder, dirname);
    if (!fs.existsSync(dir)) {
      throw new Error(`Could not find the reference model folder: ${dir}`);
    }
    return path.join(dir, filename);
  }

  static getTestOutput(group: string | null, filename: string): string {
    const dir = group ? path.join(outputFolder, group) : outputFolder;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return path.join(dir, filename);
  }
}

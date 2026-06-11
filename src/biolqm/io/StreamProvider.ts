import * as fs from "fs";
import * as path from "path";

export interface StreamProvider {
  output(pattern?: string): fs.WriteStream;
  input(pattern?: string): fs.ReadStream;
  getPath(pattern?: string): string;
}

class StreamProviderFileImpl implements StreamProvider {
  constructor(private readonly filePath: string) {}

  getPath(pattern = "$f"): string {
    return pattern === "$f" ? this.filePath : pattern.replace("$f", this.filePath);
  }

  output(pattern = "$f"): fs.WriteStream {
    const target = this.getPath(pattern);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    return fs.createWriteStream(target, { encoding: "utf-8" });
  }

  input(pattern = "$f"): fs.ReadStream {
    return fs.createReadStream(this.getPath(pattern), { encoding: "utf-8" });
  }
}

export const StreamProvider = {
  create(filePath: string): StreamProvider {
    return new StreamProviderFileImpl(filePath);
  }
};

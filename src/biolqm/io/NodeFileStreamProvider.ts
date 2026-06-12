import * as fs from "fs";
import * as path from "path";
import { Readable, Writable } from "stream";
import { StreamProvider } from "./StreamProvider";

class NodeFileStreamProvider implements StreamProvider {
  constructor(private readonly filePath: string) {}

  getPath(pattern = "$f"): string {
    return pattern === "$f" ? this.filePath : pattern.replace("$f", this.filePath);
  }

  async output(pattern = "$f"): Promise<WritableStream<Uint8Array>> {
    const target = this.getPath(pattern);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const stream = fs.createWriteStream(target);
    return Writable.toWeb(stream) as WritableStream<Uint8Array>;
  }

  async input(pattern = "$f"): Promise<ReadableStream<Uint8Array>> {
    const stream = fs.createReadStream(this.getPath(pattern));
    return Readable.toWeb(stream) as ReadableStream<Uint8Array>;
  }
}

export function createNodeFileStreamProvider(filePath: string): StreamProvider {
  return new NodeFileStreamProvider(filePath);
}

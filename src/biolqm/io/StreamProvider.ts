export interface StreamProvider {
  output(pattern?: string): Promise<WritableStream<Uint8Array>>;
  input(pattern?: string): Promise<ReadableStream<Uint8Array>>;
  getPath?(pattern?: string): string;
}

export async function readTextFromStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value != null) {
        result += decoder.decode(value, { stream: true });
      }
    }
    result += decoder.decode();
  } finally {
    reader.releaseLock();
  }

  return result;
}

export async function writeTextToStream(
  stream: WritableStream<Uint8Array>,
  content: string
): Promise<void> {
  const writer = stream.getWriter();
  const encoder = new TextEncoder();

  try {
    await writer.write(encoder.encode(content));
  } finally {
    await writer.close();
    writer.releaseLock();
  }
}

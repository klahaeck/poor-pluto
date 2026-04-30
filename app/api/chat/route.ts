import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";
import { systemPrompt } from "@/lib/prompts";

export const maxDuration = 30;

const DEFAULT_MODEL = "gpt-4o-mini";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body || !Array.isArray(body.messages)) {
    return new Response("Expected a messages array.", { status: 400 });
  }

  const messages = body.messages as UIMessage[];

  if (!process.env.OPENAI_API_KEY) {
    return createMissingKeyResponse(messages);
  }

  const result = streamText({
    model: openai(process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}

function createMissingKeyResponse(messages: UIMessage[]) {
  const text =
    "My OpenAI signal is not connected yet. Add OPENAI_API_KEY to .env.local, restart the dev server, and I can answer as Pluto here.";

  const stream = createUIMessageStream<UIMessage>({
    originalMessages: messages,
    execute({ writer }) {
      const id = "missing-openai-key";

      writer.write({ type: "start" });
      writer.write({ type: "text-start", id });
      writer.write({ type: "text-delta", id, delta: text });
      writer.write({ type: "text-end", id });
      writer.write({ type: "finish", finishReason: "stop" });
    },
  });

  return createUIMessageStreamResponse({ stream });
}

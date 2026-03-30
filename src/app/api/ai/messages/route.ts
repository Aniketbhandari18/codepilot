import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { NextRequest } from "next/server";

// NOTE: This is a temporary/test implementation.
// Actual chat logic (messages, context, etc.) is not wired yet.
export async function POST(req: NextRequest) {
  const result = streamText({
    model: google("gemini-2.5-flash-lite"),
    system: "You are a helpful assistant.",
    prompt: "write me a 700 charachter gibberish",
  });

  return result.toUIMessageStreamResponse();
}

import { inngest } from "@/inngest/client";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../../../convex/_generated/api";
import z from "zod";
import { Id } from "../../../../../convex/_generated/dataModel";

const reqBodySchema = z.object({
  assistantMessageId: z.string(),
});

export async function POST(req: NextRequest) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json("Unauthroized", {
      status: 401,
    });
  }

  const token = await getToken({ template: "convex" });

  if (!token) {
    return NextResponse.json(
      { error: "Convex token missing" },
      { status: 401 },
    );
  }

  const body = await req.json();

  const parsed = reqBodySchema.safeParse(body);
  if (!parsed.success) {
    console.log(parsed.error.issues);

    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { assistantMessageId } = parsed.data;

  const message = await fetchQuery(
    api.messages.getById,
    {
      messageId: assistantMessageId as Id<"messages">,
    },
    { token: token },
  );

  if (message.role !== "assistant" || message.status !== "processing") {
    return NextResponse.json(
      { error: "messageId must reference a processing assistant message" },
      { status: 400 },
    );
  }

  // Remove all processingMessages first
  // Ideally processingMessages should be of length 1 (excluding current assistant message)
  const processingMessages = await fetchQuery(
    api.messages.getProcessingMessages,
    {
      projectId: message.projectId,
    },
    { token: token },
  );

  // Cancel all processingMessages except current assistant message (ideally 1)
  await Promise.all(
    processingMessages.map(async (msg) => {
      if (msg._id === assistantMessageId) return;

      await inngest.send({
        name: "message/cancel",
        data: {
          messageId: msg._id,
          token: token,
        },
      });

      await fetchMutation(
        api.messages.update,
        {
          messageId: msg._id,
          status: "cancelled",
        },
        { token: token },
      );
    }),
  );

  await inngest.send({
    name: "message/sent",
    data: {
      messageId: assistantMessageId,
      token,
    },
  });

  return NextResponse.json({ message: "Event sent" });
}

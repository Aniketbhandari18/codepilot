import { inngest } from "@/inngest/client";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { after, NextRequest, NextResponse } from "next/server";
import { api } from "../../../../../convex/_generated/api";
import z from "zod";
import { Id } from "../../../../../convex/_generated/dataModel";
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { TEMPLATE_SYSTEM_PROMPT } from "@/constants";

const reqBodySchema = z.object({
  assistantMessageId: z.string(),
  userMessage: z.string(),
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

  const { assistantMessageId, userMessage } = parsed.data;

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

  const projectId = message.projectId;
  const project = await fetchQuery(
    api.projects.getById,
    {
      projectId: projectId,
    },
    { token: token },
  );

  if (!project || project.ownerId !== userId) {
    return NextResponse.json(
      { error: "Project doesn't exist" },
      { status: 400 },
    );
  }

  // Remove all processingMessages first
  if (project.initialized) {
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
  }

  // generate template and create template files
  if (!project.initialized) {
    after(async () => {
      let template: "react" | "nextjs" | "nodejs" | "none";

      try {
        const { output } = await generateText({
          model: google("gemini-2.5-flash-lite"),
          output: Output.object({
            schema: z.object({
              template: z.enum(["react", "nextjs", "nodejs", "none"]),
            }),
          }),
          system: TEMPLATE_SYSTEM_PROMPT,
          prompt: userMessage,
        });

        template = output.template;
      } catch (error) {
        template = "none";
      }

      if (template !== "none") {
        // Create template files in the project
        await fetchMutation(
          api.files.createTemplateFiles,
          {
            projectId: projectId,
            template: template,
          },
          { token: token },
        );
      }

      // Mark the project as initialized
      await fetchMutation(
        api.projects.markInitialized,
        {
          projectId: projectId,
        },
        { token: token },
      );
    });
  }

  await inngest.send({
    name: "message/sent",
    data: {
      assistantMessageId: assistantMessageId,
      userMessage,
      token,
    },
  });

  return NextResponse.json({ message: "Event sent" });
}

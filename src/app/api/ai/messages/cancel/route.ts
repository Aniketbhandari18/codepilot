import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { inngest } from "@/inngest/client";

const reqBodySchema = z.object({
  projectId: z.string(),
});

export async function POST(req: NextRequest) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const { projectId } = parsed.data;

  const project = await fetchQuery(
    api.projects.getById,
    {
      projectId: projectId as Id<"projects">,
    },
    { token: token },
  );

  if (!project || project.ownerId !== userId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Ideally processingMessages should be of length 1
  const processingMessages = await fetchQuery(
    api.messages.getProcessingMessages,
    {
      projectId: projectId as Id<"projects">,
    },
    { token: token },
  );

  // Cancel all processingMessages(ideally 1)
  await Promise.all(
    processingMessages.map(async (msg) => {
      await fetchMutation(
        api.messages.update,
        {
          messageId: msg._id,
          status: "cancelled",
          content: "Request cancelled",
        },
        { token: token },
      );

      await inngest.send({
        name: "message/cancel",
        data: {
          messageId: msg._id,
          token: token,
        },
      });
    }),
  );

  return NextResponse.json({
    success: true,
  });
}

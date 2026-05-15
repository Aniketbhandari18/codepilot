import { inngest } from "@/inngest/client";
import { createAgent, createNetwork, gemini } from "@inngest/agent-kit";

import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { listFilesTool } from "./tools/listFiles";
import { readFilesTool } from "./tools/readFiles";
import { createFilesTool } from "./tools/createFiles";
import { updateFilesTool } from "./tools/updateFiles";
import { renameFileTool } from "./tools/renameFile";
import { deleteFilesTool } from "./tools/deleteFiles";
import { CODING_AGENT_SYSTEM_PROMPT } from "./constants";
import { createFolderTool } from "./tools/createFolder";

type ProcessMessageEvent = {
  assistantMessageId: string;
  userMessage: string;
  token: string;
};

export const processMessage = inngest.createFunction(
  {
    id: "process-message",
    cancelOn: [
      {
        event: "message/cancel",
        if: "event.data.messageId == async.data.messageId",
      },
    ],
    onFailure: async ({ event, step }) => {
      const { assistantMessageId, token } = event.data.event
        .data as ProcessMessageEvent;

      await step.run("update-message-on-failure", async () => {
        await fetchMutation(
          api.messages.update,
          {
            messageId: assistantMessageId as Id<"messages">,
            content:
              "Sorry, something went wrong while processing your request. Please try again.",
            status: "completed",
          },
          { token: token },
        );
      });
    },
    triggers: { event: "message/sent" },
  },
  async ({ event, step }) => {
    const { assistantMessageId, userMessage, token } =
      event.data as ProcessMessageEvent;

    const assistantMessage = await fetchQuery(
      api.messages.getById,
      {
        messageId: assistantMessageId as Id<"messages">,
      },
      { token: token },
    );

    if (assistantMessage.status === "cancelled") {
      return { message: "Message already cancelled" };
    }

    // Build system prompt with recent messages
    let systemPrompt = CODING_AGENT_SYSTEM_PROMPT;

    let recentMessages = await fetchQuery(
      api.messages.getRecentMessages,
      {
        conversationId: assistantMessage.conversationId,
        limit: 10,
      },
      { token: token },
    );

    // exclude the current processing assistant message
    recentMessages = recentMessages.filter(
      (msg) => msg._id !== assistantMessageId,
    );

    if (recentMessages.length) {
      const contextMessages = recentMessages
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n\n");

      systemPrompt += `\n\n## Previous Conversation (for context only - do NOT repeat these responses):\n${contextMessages}\n\n## Current Request:\nRespond ONLY to the user's new message below. Do not repeat or reference your previous responses.`;
    }

    // Create coding agent
    const codingAgent = createAgent({
      name: "code-pilot",
      description: "An expert AI coding agent",
      system: systemPrompt,
      model: gemini({
        model: "gemini-2.5-flash",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      }),
      tools: [
        listFilesTool({ projectId: assistantMessage.projectId, token }),
        readFilesTool({ token }),
        createFilesTool({ projectId: assistantMessage.projectId, token }),
        createFolderTool({ projectId: assistantMessage.projectId, token }),
        updateFilesTool({ token }),
        renameFileTool({ token }),
        deleteFilesTool({ token }),
      ],
    });

    const network = createNetwork({
      name: "code-pilot-network",
      agents: [codingAgent],
      maxIter: 25, // I have to increase it
      router: ({ lastResult }) => {
        const lastMessage = lastResult?.output.at(-1);

        if (!lastMessage) return codingAgent;

        const isToolCall = lastMessage?.type === "tool_call";

        return isToolCall ? codingAgent : undefined;
      },
    });

    // Run the agent
    const result = await network.run(userMessage);

    const lastResult = result.state.results.at(-1);

    console.log("output:", lastResult?.output);
    const textMessage = lastResult?.output.find(
      (msg) => msg.type === "text" && msg.role === "assistant",
    );
    console.log("textMessage:", textMessage);

    let assistantResponse =
      "I processed your request. Let me know if you need anything else!";

    if (textMessage?.type === "text") {
      if (typeof textMessage.content === "string") {
        assistantResponse = textMessage.content;
      } else {
        assistantResponse = textMessage.content.map((c) => c.text).join("");
      }
    }

    // update assistant message
    await step.run("update-assistant-message", async () => {
      await fetchMutation(
        api.messages.update,
        {
          messageId: assistantMessageId as Id<"messages">,
          content: assistantResponse,
          status: "completed",
        },
        { token: token },
      );
    });

    return { message: "Assistant message completed" };
  },
);

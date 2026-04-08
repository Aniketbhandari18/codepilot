import { inngest } from "@/inngest/client";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

type ProcessMessageEvent = {
  messageId: string;
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
      const { messageId, token } = event.data.event.data as ProcessMessageEvent;

      await step.run("update-message-on-failure", async () => {
        await fetchMutation(
          api.messages.update,
          {
            messageId: messageId as Id<"messages">,
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
    const { messageId, token } = event.data as ProcessMessageEvent;

    const message = await fetchQuery(
      api.messages.getById,
      {
        messageId: messageId as Id<"messages">,
      },
      { token: token },
    );

    if (message.status === "cancelled") {
      return { message: "Message already cancelled" };
    }

    // ai processing (will be implemented later)
    await step.sleep("ai-processing", "5s");

    // update assistant message
    await step.run("update-assistant-message", async () => {
      await fetchMutation(
        api.messages.update,
        {
          messageId: messageId as Id<"messages">,
          content: "Ai processing completed",
          status: "completed",
        },
        { token: token },
      );
    });

    return { message: "Assistant message completed" };
  },
);

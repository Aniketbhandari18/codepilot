import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processMessage } from "@/features/projects/Conversation/inngest/processMessage";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processMessage],
});

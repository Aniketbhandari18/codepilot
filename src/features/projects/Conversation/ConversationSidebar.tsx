import { useChat } from "@ai-sdk/react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { useMutation, useQuery } from "convex/react";
import { MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { DefaultChatTransport, UIMessage } from "ai";
import { Loader as AiLoader } from "@/components/ai-elements/loader";
import Loader from "@/components/Loader";

type Props = {
  projectId: Id<"projects">;
};

const ConversationSidebar = ({ projectId }: Props) => {
  const [activeConversationId, setActiveConversationId] =
    useState<Id<"conversations"> | null>(null);

  const [input, setInput] = useState("");

  const conversations = useQuery(api.conversations.getAll, {
    projectId: projectId,
  });

  const dbMessages = useQuery(
    api.messages.getAll,
    activeConversationId ? { conversationId: activeConversationId } : "skip",
  );

  const customizedDbMessages = dbMessages?.map((m) => ({
    id: m._id,
    role: m.role,
    parts: [
      {
        type: "text",
        text: m.content,
      },
    ],
  })) as UIMessage[] | undefined;

  const loadingMessages = dbMessages === undefined;

  const createMessage = useMutation(api.messages.create);

  const { messages, sendMessage, status, setMessages, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/messages",
    }),
    onFinish: async ({ message }) => {
      if (!activeConversationId) return;

      const text = message.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("");

      if (!text.trim()) return;

      await createMessage({
        conversationId: activeConversationId,
        content: text,
        role: "assistant",
        status: "completed",
      });
    },
  });

  useEffect(() => {
    if (!activeConversationId && conversations?.length) {
      setActiveConversationId(conversations[0]._id);
    }
  }, [conversations]);

  useEffect(() => {
    if (customizedDbMessages) {
      setMessages(customizedDbMessages);
    }
  }, [dbMessages, setMessages]);

  const handleSubmit = async (message: PromptInputMessage) => {
    if (!activeConversationId) return;

    const trimmedMessage = message.text.trim();
    if (!trimmedMessage) return;

    await createMessage({
      conversationId: activeConversationId,
      content: trimmedMessage,
      role: "user",
      status: "completed",
    });

    setInput("");
    sendMessage({ text: message.text.trim() });
  };

  return (
    <div className="p-2 pr-1 relative size-full rounded-lg border h-full flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col">
        {loadingMessages ? (
          <div className="flex flex-1 justify-center items-center">
            <Loader />
          </div>
        ) : (
          <Conversation>
            <ConversationContent className="p-0 gap-6 pr-1">
              {messages &&
                (messages.length === 0 ? (
                  <ConversationEmptyState
                    className="h-full"
                    icon={<MessageSquare className="size-12" />}
                    title="Start a conversation"
                    description="Type a message below to begin chatting"
                  />
                ) : (
                  messages.map((message) => (
                    <Message from={message.role} key={message.id}>
                      <MessageContent
                        className={`${message.role === "user" ? "bg-blue-500! text-white!" : "bg-white/20! text-zinc-100!"} py-2`}
                      >
                        {message.parts.map((part, i) => {
                          switch (part.type) {
                            case "text":
                              return (
                                <MessageResponse key={`${message.id}-${i}`}>
                                  {part.text}
                                </MessageResponse>
                              );
                            default:
                              return null;
                          }
                        })}
                      </MessageContent>
                    </Message>
                  ))
                ))}
              {status === "submitted" && (
                <div>
                  <AiLoader />
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        )}

        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              placeholder="How can CodePilot help you today?"
              onChange={(e) => setInput(e.target.value)}
            />
          </PromptInputBody>

          <PromptInputFooter className="justify-end px-1.5 pb-1.5">
            <PromptInputSubmit
              status={status}
              disabled={
                loadingMessages ||
                status === "submitted" ||
                (status === "ready" && !input.trim())
              }
              onClick={() => {
                if (status === "submitted" || status === "streaming") {
                  stop();
                }
              }}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};
export default ConversationSidebar;

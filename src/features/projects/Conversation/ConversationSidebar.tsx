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
import { MessageSquare, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Loader as AiLoader } from "@/components/ai-elements/loader";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import ConversationTitle from "./ConversationTitle";
import PastConversationsDialog from "./PastConversationsDialog";
import axios from "axios";

type Props = {
  projectId: Id<"projects">;
};

const ConversationSidebar = ({ projectId }: Props) => {
  const [activeConversationId, setActiveConversationId] =
    useState<Id<"conversations"> | null>(null);

  const [input, setInput] = useState("");
  const cancelInProgressRef = useRef<boolean>(false);

  const conversations = useQuery(api.conversations.getAll, {
    projectId: projectId,
  });

  const messages = useQuery(
    api.messages.getAll,
    activeConversationId ? { conversationId: activeConversationId } : "skip",
  );

  const activeConversation = conversations?.find(
    (c) => c._id === activeConversationId,
  );

  const isProcessing =
    messages?.some((m) => m.status === "processing") ?? false;

  const loadingMessages = messages === undefined;

  const createConversation = useMutation(api.conversations.create);

  const createMessage = useMutation(api.messages.create).withOptimisticUpdate(
    (localStore, args) => {
      const tempId = crypto.randomUUID() as Id<"messages">;

      const existingMessages = localStore.getQuery(api.messages.getAll, {
        conversationId: args.conversationId,
      });

      if (!existingMessages) return;

      const newMessage = {
        _id: tempId,
        _creationTime: Date.now(),
        conversationId: args.conversationId,
        projectId: projectId,
        content: args.content,
        role: args.role,
        status: args.status,
        updatedAt: Date.now(),
      };

      localStore.setQuery(
        api.messages.getAll,
        { conversationId: args.conversationId },
        [...existingMessages, newMessage],
      );
    },
  );

  useEffect(() => {
    if (!activeConversationId && conversations?.length) {
      setActiveConversationId(conversations[0]._id);
    }
  }, [conversations]);

  const handleCreateConversation = async () => {
    const id = await createConversation({
      projectId: projectId,
    });

    setActiveConversationId(id);
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    // handleCancel
    if (isProcessing) {
      if (cancelInProgressRef.current) return;

      cancelInProgressRef.current = true;
      await axios.post("/api/ai/messages/cancel", {
        projectId: projectId,
      });
      cancelInProgressRef.current = false;

      return;
    }

    if (!activeConversationId) return;

    const trimmedMessage = message.text.trim();
    if (!trimmedMessage) return;

    // Create user message
    createMessage({
      conversationId: activeConversationId,
      content: trimmedMessage,
      role: "user",
      status: "completed",
    });

    setInput("");

    // Create assistant processing message (update later when message proceessing completes)
    const assistantMsgId = await createMessage({
      conversationId: activeConversationId,
      content: "processing...",
      role: "assistant",
      status: "processing",
    });

    await axios.post("/api/ai/messages", {
      assistantMessageId: assistantMsgId,
    });
  };

  return (
    <div className="p-2 pt-1 pr-1 relative size-full rounded-lg border h-full flex flex-col">
      <div className="flex justify-between items-center mb-1">
        <ConversationTitle
          projectId={projectId}
          conversation={activeConversation}
        />
        <div className="space-x-1 flex">
          <PastConversationsDialog
            conversations={conversations}
            onSelect={setActiveConversationId}
            activeConversationId={activeConversationId}
            setActiveConversationId={setActiveConversationId}
          />
          <Button
            className="p-1! h-7"
            variant="outline"
            size="sm"
            onClick={handleCreateConversation}
          >
            <Plus className="h-4.25! w-5!" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {loadingMessages ? (
          <div className="flex flex-1 justify-center items-center">
            <Loader />
          </div>
        ) : (
          <Conversation>
            <ConversationContent
              className={`p-0 gap-6 pr-1 ${messages.length === 0 ? "h-full" : ""}`}
            >
              {messages.length === 0 ? (
                <ConversationEmptyState
                  className="h-full"
                  icon={<MessageSquare className="size-12" />}
                  title="Start a conversation"
                  description="Type a message below to begin chatting"
                />
              ) : (
                messages.map((message) => (
                  <Message from={message.role} key={message._id}>
                    <MessageContent
                      className={`${message.role === "user" ? "bg-white/20! text-zinc-100!" : ""} py-2`}
                    >
                      {message.status === "processing" ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <AiLoader />
                          <span>Thinking...</span>
                        </div>
                      ) : message.status === "cancelled" ? (
                        <span className="text-muted-foreground italic">
                          Request cancelled
                        </span>
                      ) : (
                        <MessageResponse>{message.content}</MessageResponse>
                      )}
                    </MessageContent>
                  </Message>
                ))
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
              status={isProcessing ? "streaming" : undefined}
              disabled={
                loadingMessages || (isProcessing ? false : !input.trim())
              }
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};
export default ConversationSidebar;

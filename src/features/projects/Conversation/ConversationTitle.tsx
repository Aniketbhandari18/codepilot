"use client";

import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { KeyboardEvent, useState } from "react";

type Props = {
  projectId: Id<"projects">;
  conversation: Doc<"conversations"> | undefined;
};

const ConversationTitle = ({ projectId, conversation }: Props) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [title, setTitle] = useState("");

  const renameConversation = useMutation(
    api.conversations.rename,
  ).withOptimisticUpdate((localStore, args) => {
    const currentConversations = localStore.getQuery(api.conversations.getAll, {
      projectId: projectId,
    });

    if (!currentConversations) return;

    const newConversations = currentConversations.map((c) => {
      if (c._id === args.conversationId) {
        return { ...c, title: args.title };
      }
      return c;
    });

    localStore.setQuery(
      api.conversations.getAll,
      { projectId: projectId },
      newConversations,
    );
  });

  const handleStartRenaming = () => {
    if (!conversation) return;

    setTitle(conversation.title);
    setIsRenaming(true);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setIsRenaming(false);
      setTitle("");
    }
  };

  const handleRename = () => {
    const trimmedTitle = title.trim();
    setTitle("");
    setIsRenaming(false);

    if (!conversation) return;

    if (!trimmedTitle || conversation.title === trimmedTitle) return;
    renameConversation({
      conversationId: conversation._id,
      title: trimmedTitle,
    });
  };

  if (!projectId) return null;

  return (
    <>
      {conversation === undefined && (
        <Skeleton className="h-4 w-34 rounded-sm" />
      )}
      {conversation &&
        (isRenaming ? (
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={(e) => e.target.select()}
            onBlur={handleRename}
          />
        ) : (
          <span
            className="font-semibold text-white/80 max-w-50 truncate"
            onClick={handleStartRenaming}
          >
            {conversation.title}
          </span>
        ))}
    </>
  );
};
export default ConversationTitle;

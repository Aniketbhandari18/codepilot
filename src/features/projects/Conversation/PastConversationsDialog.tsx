import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { History, Trash2 } from "lucide-react";
import { Dispatch, MouseEvent, SetStateAction, useState } from "react";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

type Props = {
  conversations: Doc<"conversations">[] | undefined;
  onSelect: (conversationId: Id<"conversations">) => void;
  activeConversationId: Id<"conversations"> | null;
  setActiveConversationId: Dispatch<SetStateAction<Id<"conversations"> | null>>;
};

const PastConversationsDialog = ({
  conversations,
  onSelect,
  activeConversationId,
  setActiveConversationId,
}: Props) => {
  const [open, setOpen] = useState(false);

  const removeConversation = useMutation(api.conversations.remove);

  const handleSelect = (conversationId: Id<"conversations">) => {
    onSelect(conversationId);
    setOpen(false);
  };

  const handleRemove = (
    e: MouseEvent<HTMLButtonElement>,
    conversationId: Id<"conversations">,
  ) => {
    e.stopPropagation();

    removeConversation({
      conversationId: conversationId,
    });

    if (conversationId === activeConversationId) {
      setActiveConversationId(null);
      setOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Button
        className="p-1! h-7"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <History className="h-4.25! w-5!" />
      </Button>
      <CommandDialog className="" open={open} onOpenChange={setOpen}>
        <Command className="bg-white/10 border border-zinc-700 rounded-lg">
          <CommandInput placeholder="Search conversations..." />

          <CommandList>
            <CommandEmpty>No conversation found.</CommandEmpty>
            <CommandGroup heading="Conversations">
              {conversations?.map((conversation, idx) => (
                <CommandItem
                  key={conversation._id}
                  value={`${conversation.title}-${conversation._id}`}
                  onSelect={() => handleSelect(conversation._id)}
                  className="cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="truncate">{conversation.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(conversation.updatedAt, {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-60 hover:opacity-100"
                    onClick={(e) => handleRemove(e, conversation._id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
};
export default PastConversationsDialog;

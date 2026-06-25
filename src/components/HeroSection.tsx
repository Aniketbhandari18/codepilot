import axios from "axios";
import { useMutation } from "convex/react";
import { ArrowRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState, useTransition } from "react";
import { FaGithub } from "react-icons/fa";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";

const HeroSection = () => {
  const [prompt, setPrompt] = useState("");
  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  const createProject = useMutation(api.projects.createProject);

  const handleCreateProject = async () => {
    startTransition(async () => {
      const { projectId, assistantMsgId } = await createProject({
        name: "project",
        prompt: prompt.trim(),
      });

      axios.post("/api/ai/messages", {
        assistantMessageId: assistantMsgId,
        userMessage: prompt.trim(),
      });

      router.push(`/projects/${projectId}`);
    });
  };

  return (
    <section className="relative pt-32 pb-12 md:pt-44 md:pb-20 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[calc(4rem+25%)] left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-100 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-5"
        >
          What will you <span className="text-gradient">build</span> today?
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-10"
        >
          Create stunning apps & websites by chatting with AI. From idea to
          production in minutes, not months.
        </motion.p>

        {/* AI Input Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <div className="relative glass-card rounded-2xl p-1.5">
            <div className="flex items-center gap-3 bg-secondary/60 rounded-xl px-4 py-3">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Build a fully functional todo app..."
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm md:text-base"
              />
              <button
                disabled={isPending || !prompt.trim()}
                onClick={handleCreateProject}
                className="shrink-0 w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {!isPending ? (
                  <ArrowRight size={16} />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
              </button>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <FaGithub size={14} />
            Import from GitHub
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

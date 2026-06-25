import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { Sparkles, Code2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";

const FRAMEWORKS = [
  {
    id: "html",
    name: "HTML",
    desc: "Static site with HTML, CSS & JS",
    logo: "/HTML5.png",
  },
  {
    id: "nextjs",
    name: "Next.js",
    desc: "React framework for production",
    logo: "/Next.js.png",
  },
  {
    id: "react",
    name: "React.js",
    desc: "Component-based UI library",
    logo: "/React.png",
  },
  {
    id: "nodejs",
    name: "Node.js",
    desc: "Server-side JavaScript runtime",
    logo: "/Node.js.png",
  },
] as const;

type FrameWork = (typeof FRAMEWORKS)[number]["id"];

const CreateProjectSection = () => {
  const [name, setName] = useState("");
  const [framework, setFramework] = useState<FrameWork>("html");
  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  const createProject = useMutation(api.projects.createProject);

  const handleCreateProject = () => {
    startTransition(async () => {
      const { projectId } = await createProject({
        name: name,
        template: framework,
      });

      router.push(`/projects/${projectId}`);
    });
  };

  return (
    <section className="relative py-16 md:py-24 pb-12!">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-border bg-secondary/50 text-xs text-muted-foreground">
            <Code2 size={12} />
            Start from scratch
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Create a new <span className="text-gradient">project</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Skip the prompt — pick a framework and start building manually.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-card rounded-2xl p-6 md:p-8"
        >
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Project name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-awesome-app"
            className="w-full bg-secondary/60 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/60 transition-colors mb-6"
          />

          <label className="block text-sm font-medium text-muted-foreground mb-3">
            Choose a framework
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {FRAMEWORKS.map((f) => {
              const active = framework === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFramework(f.id)}
                  className={`relative text-left p-4 rounded-xl border transition-all ${
                    active
                      ? "border-primary/60 bg-primary/10 glow-primary"
                      : "border-border bg-secondary/40 hover:border-border/80 hover:bg-secondary/60"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm mb-3 `}
                  >
                    <img src={f.logo} />
                  </div>
                  <div className="font-medium  text-foreground mb-0.5">
                    {f.name}
                  </div>
                  <div className="text-sm text-muted-foreground leading-tight">
                    {f.desc}
                  </div>
                </button>
              );
            })}
          </div>

          <Button
            onClick={handleCreateProject}
            disabled={isPending || !name.trim()}
            size="lg"
            className="w-full"
          >
            {!isPending ? (
              <>
                <Sparkles size={16} />
                Create Project
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CreateProjectSection;

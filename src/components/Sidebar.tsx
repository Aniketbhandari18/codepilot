import { motion, AnimatePresence } from "motion/react";
import { X, FolderGit2, Plus } from "lucide-react";
import { Doc } from "../../convex/_generated/dataModel";
import Link from "next/link";

type Props = {
  projects: Doc<"projects">[];
  open: boolean;
  onClose: () => void;
};

const Sidebar = ({ open, onClose, projects }: Props) => {
  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 top-16 z-40 bg-background/60 backdrop-blur-sm "
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed inset-y-0 top-16 left-0 z-50 w-72 glass border-r border-border/50 flex flex-col"
            >
              <div className="flex items-center justify-between h-16 px-5 border-b border-border/50">
                <div className="flex items-center gap-2 text-white/80">
                  <FolderGit2 size={16} />
                  <span className="font-display text-sm font-semibold ">
                    Your Projects
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-4">
                {projects.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground px-4 py-12">
                    <Plus size={20} className="mx-auto mb-3 opacity-40" />
                    No projects yet.
                    <br />
                    Create one to get started.
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {projects.map((p) => (
                      <li key={p._id}>
                        <Link
                          href={`/projects/${p._id}`}
                          className="block text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors truncate"
                        >
                          {p.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;

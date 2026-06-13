import { motion } from "framer-motion";

const EditorMockup = () => {
  return (
    <section className="relative py-12 md:py-20 overflow-hidden pt-60! pb-60!">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Main glow */}
          <div className="absolute inset-0 -z-10 bg-cyan-500/20 blur-[120px] scale-110 rounded-full" />

          {/* Secondary glow */}
          <div className="absolute inset-20 -z-10 bg-cyan-400/15 blur-[80px] rounded-full" />

          <div className="relative rounded-2xl overflow-hidden"></div>
          {/* <div className="relative rounded-2xl overflow-hidden border border-cyan-400/20"></div> */}
          {/* Glow behind */}
          {/* <div className="absolute inset-0 -z-10 bg-blue-500/20 blur-3xl scale-110 rounded-3xl" /> */}
          {/* <div className="absolute inset-4 -z-10 bg-blue-500/20 blur-2xl rounded-2xl" /> */}
          {/* <div className="absolute -inset-2 bg-linear-to-r from-pink-600/20 to-purple-600/20 rounded-lg blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div> */}
          {/* <div className="absolute inset-0 -inset-x-10 -inset-y-10 rounded-3xl bg-primary/8 blur-[80px] pointer-events-none" /> */}

          <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-primary/5 w-full h-auto">
            <img
              src="/EditorMockup.jpeg"
              alt="CodePilot AI editor interface"
              className="w-full h-auto"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default EditorMockup;

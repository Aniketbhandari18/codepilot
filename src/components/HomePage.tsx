"use client";

import { useQuery } from "convex/react";
import CreateProjectSection from "./CreateProjectSectoin";
import HeroSection from "./HeroSection";
import Sidebar from "./Sidebar";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { PanelLeft } from "lucide-react";

const HomePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const projects = useQuery(api.projects.getProjects, {});

  return (
    <div className="relative">
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed z-20 ml-3 mt-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle projects sidebar"
        >
          <PanelLeft size={18} />
        </button>
      )}
      <Sidebar
        projects={projects ?? []}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <HeroSection />
      <CreateProjectSection />
    </div>
  );
};
export default HomePage;

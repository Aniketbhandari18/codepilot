import { Button } from "./ui/button";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import ProjectBreadcrumb from "@/features/projects/ProjectBreadcrumb";

const Navbar = () => {
  return (
    <nav
      className={`fixed top-0 left-0 right-0 backdrop-blur-[20px] border-b border-white/15 z-50 transition-all duration-300`}
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-6">
        <div className="flex items-center justify-between gap-3">
          <a
            href="/"
            className="font-display text-xl font-bold tracking-tight text-foreground"
          >
            CodePilot
          </a>
          <ProjectBreadcrumb />
        </div>

        <div className="hidden md:flex items-center gap-3">
          <SignedIn>
            <UserButton />
          </SignedIn>

          <SignedOut>
            <SignInButton>
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </SignInButton>

            <SignUpButton>
              <Button size="sm" className="btn-glow relative">
                Get Started
              </Button>
            </SignUpButton>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;

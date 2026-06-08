"use client";

import { ClerkLoaded, ClerkLoading, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode } from "react";
import Loader from "./Loader";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <ClerkLoaded>{children}</ClerkLoaded>
      <ClerkLoading>
        <div className="flex justify-center items-center h-screen">
          <Loader />
        </div>
      </ClerkLoading>
    </ConvexProviderWithClerk>
  );
}

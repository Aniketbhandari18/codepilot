"use client";

import { usePathname } from "next/navigation";

export default function MainLayout({
  children,
  Navbar,
}: {
  children: React.ReactNode;
  Navbar: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideNavbarOnRoutes = ["/sign-in", "/sign-up"];
  const shouldHideNavbar = hideNavbarOnRoutes.some((route) =>
    pathname.startsWith(route),
  );

  return (
    <div className="min-h-screen flex flex-col">
      {!shouldHideNavbar && Navbar}
      <main className={`${!shouldHideNavbar && "pt-16"} flex-1 flex flex-col`}>
        {children}
      </main>
    </div>
  );
}

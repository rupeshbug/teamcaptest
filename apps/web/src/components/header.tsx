import {
  OrganizationSwitcher,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/tanstack-react-start";
import { Button } from "@teamcap/ui/components/button";
import { SidebarTrigger } from "@teamcap/ui/components/sidebar";

import ThemeToggle from "./theme-toggle";

export default function Header() {
  const { isLoaded, user } = useUser();

  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 flex w-full min-w-0 items-center justify-between border-b px-4 py-3 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="md:hidden" />
        <SidebarTrigger className="hidden md:inline-flex" />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-muted-foreground text-[11px] uppercase tracking-[0.25em]">Teamcap</p>
          <h1 className="truncate text-sm font-medium">Workspace</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        {isLoaded && user ? (
          <>
            <OrganizationSwitcher
              hidePersonal
              appearance={{
                elements: {
                  organizationSwitcherTrigger:
                    "border-border bg-background text-foreground hover:bg-muted h-8 rounded-none border px-2.5 text-xs shadow-none",
                },
              }}
            />
            <UserButton />
          </>
        ) : (
          <>
            <SignInButton mode="modal">
              <Button variant="outline">Sign in</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button>Sign up</Button>
            </SignUpButton>
          </>
        )}
      </div>
    </header>
  );
}

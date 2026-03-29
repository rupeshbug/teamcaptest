import { ClerkProvider, useAuth } from "@clerk/tanstack-react-start";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  Link,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader as AppSidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@teamcap/ui/components/sidebar";
import { Toaster } from "@teamcap/ui/components/sonner";
import { TooltipProvider } from "@teamcap/ui/components/tooltip";
import { BarChart3, CheckSquare, Users } from "lucide-react";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";

import { setClerkAuthTokenGetter } from "@/utils/clerk-auth";

import Header from "../components/header";

import appCss from "../index.css?url";

function ClerkApiAuthBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setClerkAuthTokenGetter(getToken);

    return () => {
      setClerkAuthTokenGetter(null);
    };
  }, [getToken]);

  return null;
}

import type { orpc } from "@/utils/orpc";
export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "My App",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RootDocument,
});

const navigation = [
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard", label: "Team", icon: Users },
] as const;

function RootDocument() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <ClerkProvider>
      <ClerkApiAuthBridge />
      <html lang="en" suppressHydrationWarning>
        <head>
          <HeadContent />
        </head>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <SidebarProvider>
                <div className="bg-background text-foreground flex h-svh w-full min-w-0 overflow-hidden">
                  <Sidebar collapsible="icon" variant="sidebar">
                    <AppSidebarHeader>
                      <div className="flex flex-col gap-1 px-2 py-1">
                        <p className="text-sidebar-foreground/60 text-[11px] uppercase tracking-[0.25em]">
                          Navigation
                        </p>
                        <p className="text-sm font-medium">Team workspace</p>
                      </div>
                    </AppSidebarHeader>
                    <SidebarContent>
                      <SidebarGroup>
                        <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                        <SidebarGroupContent>
                          <SidebarMenu>
                            {navigation.map(({ to, label, icon: Icon }) => (
                              <SidebarMenuItem key={to}>
                                <SidebarMenuButton
                                  render={<Link to={to} />}
                                  isActive={pathname === to}
                                  tooltip={label}
                                >
                                  <Icon />
                                  <span>{label}</span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))}
                          </SidebarMenu>
                        </SidebarGroupContent>
                      </SidebarGroup>
                    </SidebarContent>
                    <SidebarRail />
                  </Sidebar>
                  <SidebarInset className="w-full min-w-0">
                    <Header />
                    <main className="flex min-h-0 w-full min-w-0 flex-1 overflow-auto px-4 py-4 md:px-6 md:py-6">
                      <Outlet />
                    </main>
                  </SidebarInset>
                </div>
              </SidebarProvider>
            </TooltipProvider>
            <Toaster richColors />
            <TanStackRouterDevtools position="bottom-left" />
            <ReactQueryDevtools
              position="bottom"
              buttonPosition="bottom-right"
            />
            <Scripts />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

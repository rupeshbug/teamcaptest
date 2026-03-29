import {
  OrganizationSwitcher,
  SignInButton,
  UserButton,
  useClerk,
  useOrganization,
  useOrganizationList,
  useUser,
} from "@clerk/tanstack-react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@teamcap/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@teamcap/ui/components/card";
import { Input } from "@teamcap/ui/components/input";
import { Label } from "@teamcap/ui/components/label";
import { Skeleton } from "@teamcap/ui/components/skeleton";
import { cn } from "@teamcap/ui/lib/utils";
import { toast } from "sonner";

import { client } from "@/utils/orpc";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const user = useUser();
  const clerk = useClerk();
  const { organization } = useOrganization();
  const { userMemberships, isLoaded: organizationsLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });
  const [teamName, setTeamName] = useState("");
  const [teamSlug, setTeamSlug] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"org:member" | "org:admin">("org:member");

  const nameFromParts = [user.user?.firstName, user.user?.lastName].filter(Boolean).join(" ");
  const displayName =
    user.user?.fullName ||
    nameFromParts ||
    user.user?.username ||
    user.user?.primaryEmailAddress?.emailAddress ||
    user.user?.primaryPhoneNumber?.phoneNumber ||
    "User";

  const privateData = useQuery({
    ...orpc.privateData.queryOptions(),
    enabled: user.isLoaded && !!user.user,
  });

  const createTeamMutation = useMutation({
    mutationFn: (input: { name: string; slug?: string }) => client.createTeam(input),
    onSuccess: async (createdTeam) => {
      await clerk.setActive({ organization: createdTeam.id });
      setTeamName("");
      setTeamSlug("");
      await userMemberships.revalidate?.();
      toast.success(`Created ${createdTeam.name}`);
    },
    onError: (error) => {
      toast.error(error.message || "Could not create team.");
    },
  });

  const inviteTeamMemberMutation = useMutation({
    mutationFn: (input: {
      organizationId: string;
      emailAddress: string;
      role: "org:member" | "org:admin";
    }) => client.inviteTeamMember(input),
    onSuccess: (invitation) => {
      setInviteEmail("");
      setInviteRole("org:member");
      toast.success(`Invitation sent to ${invitation.emailAddress}`);
    },
    onError: (error) => {
      toast.error(error.message || "Could not send invitation.");
    },
  });

  if (!user.isLoaded) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        <Card>
          <CardHeader className="gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!user.user) {
    return (
      <div className="p-6">
        <SignInButton mode="modal">
          <Button>Sign in</Button>
        </SignInButton>
      </div>
    );
  }

  const membershipCount = userMemberships.data?.length ?? 0;

  const handleCreateTeam = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = teamName.trim();
    const normalizedSlug = normalizeSlug(teamSlug);

    if (!normalizedName) {
      toast.error("Team name is required.");
      return;
    }

    createTeamMutation.mutate({
      name: normalizedName,
      slug: normalizedSlug || undefined,
    });
  };

  const handleInviteMember = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!organization?.id) {
      toast.error("Choose a team before sending invites.");
      return;
    }

    inviteTeamMemberMutation.mutate({
      organizationId: organization.id,
      emailAddress: inviteEmail.trim(),
      role: inviteRole,
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <CardDescription className="uppercase tracking-[0.2em]">Workspace</CardDescription>
            <CardTitle className="text-3xl">Welcome {displayName}</CardTitle>
            <CardDescription>
              Create a team, switch between teams, and invite people into the active workspace.
            </CardDescription>
            <CardDescription>
              API: {privateData.data?.message ?? "Loading private session..."}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
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
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardDescription className="uppercase tracking-[0.2em]">Create Team</CardDescription>
            <CardTitle className="text-2xl">Start a new workspace</CardTitle>
            <CardDescription>
              The creator becomes the first admin and can invite everyone else.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleCreateTeam}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="team-name">Team name</Label>
                <Input
                  id="team-name"
                  placeholder="Design Ops"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="team-slug">Team slug</Label>
                <Input
                  id="team-slug"
                  placeholder="design-ops"
                  value={teamSlug}
                  onChange={(event) => setTeamSlug(event.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={createTeamMutation.isPending}>
                  {createTeamMutation.isPending ? "Creating..." : "Create team"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription className="uppercase tracking-[0.2em]">Your Teams</CardDescription>
            <CardTitle className="text-2xl">
              {organizationsLoaded ? `${membershipCount} connected workspace${membershipCount === 1 ? "" : "s"}` : "Loading teams"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {userMemberships.data?.map((membership) => {
              const isActive = membership.organization.id === organization?.id;

              return (
                <Button
                  key={membership.id}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  className="h-auto w-full justify-between px-3 py-3 text-left"
                  onClick={() => clerk.setActive({ organization: membership.organization.id })}
                >
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">{membership.organization.name}</p>
                    <p className="text-muted-foreground">{membership.role}</p>
                  </div>
                  <span className="text-muted-foreground uppercase tracking-[0.2em]">
                    {isActive ? "Active" : "Switch"}
                  </span>
                </Button>
              );
            })}

            {!userMemberships.data?.length ? (
              <div className="border-border bg-muted/30 text-muted-foreground rounded-none border border-dashed px-4 py-6">
                You do not belong to a team yet. Create one to get started.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardDescription className="uppercase tracking-[0.2em]">Invite Members</CardDescription>
          <CardTitle className="text-2xl">
            {organization ? `Invite people to ${organization.name}` : "Choose a team to invite members"}
          </CardTitle>
          <CardDescription>
            Invitations are sent through Clerk Organizations and only team admins can send them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[1.4fr_0.8fr_auto]" onSubmit={handleInviteMember}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                placeholder="teammate@company.com"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                disabled={!organization}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={inviteRole === "org:member" ? "default" : "outline"}
                  className={cn("flex-1", !organization && "pointer-events-none")}
                  disabled={!organization}
                  onClick={() => setInviteRole("org:member")}
                >
                  Member
                </Button>
                <Button
                  type="button"
                  variant={inviteRole === "org:admin" ? "default" : "outline"}
                  className={cn("flex-1", !organization && "pointer-events-none")}
                  disabled={!organization}
                  onClick={() => setInviteRole("org:admin")}
                >
                  Admin
                </Button>
              </div>
            </div>

            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full"
                disabled={!organization || inviteTeamMemberMutation.isPending}
              >
                {inviteTeamMemberMutation.isPending ? "Sending..." : "Send invite"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function normalizeSlug(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-");
  return normalized.replace(/^-|-$/g, "");
}

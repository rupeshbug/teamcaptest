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
    return <div className="p-6">Loading...</div>;
  }

  if (!user.user) {
    return (
      <div className="p-6">
        <SignInButton />
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
      <section className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-black/50">Workspace</p>
          <h1 className="text-3xl font-semibold text-black">Welcome {displayName}</h1>
          <p className="max-w-2xl text-sm text-black/65">
            Create a team, switch between teams, and invite people into the active workspace.
          </p>
          <p className="text-sm text-black/60">API: {privateData.data?.message ?? "Loading private session..."}</p>
        </div>
        <div className="flex items-center gap-3">
          <OrganizationSwitcher
            hidePersonal
            appearance={{
              elements: {
                organizationSwitcherTrigger:
                  "rounded-full border border-black/15 bg-white px-4 py-2 shadow-none",
              },
            }}
          />
          <UserButton />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-black/10 bg-[#f7f3ea] p-6">
          <div className="mb-5 space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-black/45">Create Team</p>
            <h2 className="text-2xl font-semibold text-black">Start a new workspace</h2>
            <p className="text-sm text-black/60">
              The creator becomes the first admin and can invite everyone else.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleCreateTeam}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-black">Team name</span>
              <input
                className="w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none transition focus:border-black"
                placeholder="Design Ops"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-black">Team slug</span>
              <input
                className="w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none transition focus:border-black"
                placeholder="design-ops"
                value={teamSlug}
                onChange={(event) => setTeamSlug(event.target.value)}
              />
            </label>

            <button
              type="submit"
              className="inline-flex rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/40"
              disabled={createTeamMutation.isPending}
            >
              {createTeamMutation.isPending ? "Creating..." : "Create team"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-black/10 bg-[#eef6ff] p-6">
          <div className="mb-5 space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-black/45">Your Teams</p>
            <h2 className="text-2xl font-semibold text-black">
              {organizationsLoaded ? `${membershipCount} connected workspace${membershipCount === 1 ? "" : "s"}` : "Loading teams"}
            </h2>
          </div>

          <div className="space-y-3">
            {userMemberships.data?.map((membership) => {
              const isActive = membership.organization.id === organization?.id;

              return (
                <button
                  key={membership.id}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    isActive ? "border-black bg-black text-white" : "border-black/10 bg-white text-black hover:border-black/30"
                  }`}
                  onClick={() => clerk.setActive({ organization: membership.organization.id })}
                >
                  <div>
                    <p className="font-medium">{membership.organization.name}</p>
                    <p className={`text-sm ${isActive ? "text-white/70" : "text-black/55"}`}>{membership.role}</p>
                  </div>
                  <span className={`text-xs uppercase tracking-[0.2em] ${isActive ? "text-white/70" : "text-black/45"}`}>
                    {isActive ? "Active" : "Switch"}
                  </span>
                </button>
              );
            })}

            {!userMemberships.data?.length ? (
              <div className="rounded-2xl border border-dashed border-black/15 bg-white/70 px-4 py-6 text-sm text-black/55">
                You do not belong to a team yet. Create one to get started.
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-5 space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-black/45">Invite Members</p>
          <h2 className="text-2xl font-semibold text-black">
            {organization ? `Invite people to ${organization.name}` : "Choose a team to invite members"}
          </h2>
          <p className="text-sm text-black/60">
            Invitations are sent through Clerk Organizations and only team admins can send them.
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-[1.4fr_0.8fr_auto]" onSubmit={handleInviteMember}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-black">Email</span>
            <input
              className="w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none transition focus:border-black"
              placeholder="teammate@company.com"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              disabled={!organization}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-black">Role</span>
            <select
              className="w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none transition focus:border-black"
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value as "org:member" | "org:admin")}
              disabled={!organization}
            >
              <option value="org:member">Member</option>
              <option value="org:admin">Admin</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex w-full justify-center rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/40"
              disabled={!organization || inviteTeamMemberMutation.isPending}
            >
              {inviteTeamMemberMutation.isPending ? "Sending..." : "Send invite"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function normalizeSlug(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-");
  return normalized.replace(/^-|-$/g, "");
}

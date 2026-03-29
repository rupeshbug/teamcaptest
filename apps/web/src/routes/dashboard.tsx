import { SignInButton, useUser } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@teamcap/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@teamcap/ui/components/card";

import Loader from "@/components/loader";
import RichTextViewer from "@/components/rich-text-viewer";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const user = useUser();
  const overview = useQuery({
    ...orpc.workspaceOverview.queryOptions(),
    enabled: user.isLoaded && !!user.user,
  });

  if (!user.isLoaded) {
    return <Loader />;
  }

  if (!user.user) {
    return (
      <div className="flex w-full flex-col gap-6 py-6">
        <Card>
          <CardHeader>
            <CardDescription className="uppercase tracking-[0.2em]">Team</CardDescription>
            <CardTitle className="text-2xl">Sign in to view your founder workspace</CardTitle>
          </CardHeader>
          <CardContent>
            <SignInButton mode="modal">
              <Button>Sign in</Button>
            </SignInButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (overview.isLoading || !overview.data) {
    return <Loader />;
  }

  const data = overview.data;

  return (
    <div className="flex w-full flex-col gap-6 py-6">
      <Card>
        <CardHeader>
          <CardDescription className="uppercase tracking-[0.2em]">Founder Workspace</CardDescription>
          <CardTitle className="text-3xl">{data.workspace.name}</CardTitle>
          <CardDescription>{data.workspace.summary}</CardDescription>
          <CardDescription>
            Stage: {formatToken(data.workspace.fundingStage)}. Approved equity allocated:{" "}
            {formatBasisPoints(data.counts.approvedEquityBasisPoints)}.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Founders" value={String(data.counts.founders)} detail="Require unanimous approval for task equity" />
        <MetricCard label="Founding Community" value={String(data.counts.community)} detail="Eligible for equity through approved work" />
        <MetricCard label="Employees" value={String(data.counts.employees)} detail="Invited into custom operating roles" />
        <MetricCard label="Pending Invites" value={String(data.counts.pendingInvites)} detail="Cofounders and employees still outstanding" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardDescription className="uppercase tracking-[0.2em]">People</CardDescription>
            <CardTitle className="text-2xl">Founding roster and custom roles</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-3">
            <MemberColumn title="Founders" description="Own approvals and founder governance." members={data.members.founders} />
            <MemberColumn title="Founding Community" description="Eligible for equity through approved strategic contribution." members={data.members.community} />
            <MemberColumn title="Employees" description="Custom-role teammates without founding privileges." members={data.members.employees} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription className="uppercase tracking-[0.2em]">Invites</CardDescription>
            <CardTitle className="text-2xl">Pending member invitations</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.invites.map((invite) => (
              <div key={invite.id} className="border-border flex items-start justify-between gap-4 border p-3">
                <div className="flex flex-col gap-1">
                  <p className="font-medium">{invite.email}</p>
                  <p className="text-muted-foreground">
                    {formatToken(invite.inviteType)}
                    {invite.customRoleTitle ? `, ${invite.customRoleTitle}` : ""}
                  </p>
                  <p className="text-muted-foreground">
                    Equity eligible: {invite.equityEligible ? "Yes" : "No"}
                    {invite.invitedBy ? `, invited by ${invite.invitedBy}` : ""}
                  </p>
                </div>
                <p className="text-muted-foreground uppercase tracking-[0.2em]">{invite.status}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardDescription className="uppercase tracking-[0.2em]">Cap Table</CardDescription>
            <CardTitle className="text-2xl">Equity distribution preview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.capTablePreview.map((entry) => (
              <div key={entry.memberId} className="border-border flex flex-col gap-2 border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{entry.fullName}</p>
                    <p className="text-muted-foreground">{entry.roleTitle}</p>
                  </div>
                  <p className="text-right font-medium">{entry.ownershipPercent}%</p>
                </div>
                <div className="bg-muted h-2 w-full">
                  <div className="bg-primary h-2" style={{ width: `${Math.min(entry.ownershipPercent, 100)}%` }} />
                </div>
                <p className="text-muted-foreground">
                  {formatBasisPoints(entry.approvedBasisPoints)}
                  {entry.cashInvestmentCents ? `, ${formatCurrency(entry.cashInvestmentCents)} invested` : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription className="uppercase tracking-[0.2em]">Equity Sources</CardDescription>
            <CardTitle className="text-2xl">How ownership is earned</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {data.equitySummary.bySource.map((source) => (
              <div key={source.sourceType} className="border-border flex flex-col gap-2 border p-3">
                <p className="font-medium">{source.label}</p>
                <p className="text-muted-foreground">{formatToken(source.sourceType)}</p>
                <p>{formatBasisPoints(source.basisPoints)}</p>
                <p className="text-muted-foreground">
                  {source.cashInvestmentCents ? formatCurrency(source.cashInvestmentCents) : "No direct cash component"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {data.activeContract ? (
        <Card>
          <CardHeader>
            <CardDescription className="uppercase tracking-[0.2em]">Contract</CardDescription>
            <CardTitle className="text-2xl">{data.activeContract.title}</CardTitle>
            <CardDescription>{data.activeContract.subtitle}</CardDescription>
            <CardDescription>
              Status: {formatToken(data.activeContract.status)}
              {data.activeContract.requiresFounderApproval ? ", requires founder approval" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <div className="border-border border p-4">
              <RichTextViewer blocks={data.activeContract.content} />
            </div>

            <div className="grid gap-6">
              <div className="flex flex-col gap-3">
                <p className="font-medium">Comments</p>
                {data.activeContract.comments.map((comment) => (
                  <div key={comment.id} className="border-border border p-3">
                    <p className="mb-2 font-medium">{comment.authorName}</p>
                    <RichTextViewer blocks={comment.content} />
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <p className="font-medium">Approvals</p>
                {data.activeContract.approvals.map((approval) => (
                  <div key={approval.memberId} className="border-border flex flex-col gap-1 border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{approval.memberName}</p>
                      <p className="text-muted-foreground uppercase tracking-[0.2em]">{approval.decision}</p>
                    </div>
                    {approval.note ? <p className="text-muted-foreground">{approval.note}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="uppercase tracking-[0.2em]">{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
        <CardDescription>{detail}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function MemberColumn({
  title,
  description,
  members,
}: {
  title: string;
  description: string;
  members: Array<{
    id: string;
    fullName: string;
    roleTitle: string;
    customRoleTitle: string | null;
    bio: string;
    equityEligible: boolean;
  }>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {members.map((member) => (
        <div key={member.id} className="border-border flex flex-col gap-2 border p-3">
          <div>
            <p className="font-medium">{member.fullName}</p>
            <p className="text-muted-foreground">{member.customRoleTitle || member.roleTitle}</p>
          </div>
          <p className="text-muted-foreground">{member.bio}</p>
          <p className="text-muted-foreground">Equity eligible: {member.equityEligible ? "Yes" : "No"}</p>
        </div>
      ))}
    </div>
  );
}

function formatToken(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatBasisPoints(value: number) {
  return `${(value / 100).toFixed(2)}%`;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

import { SignInButton, useUser } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@teamcap/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@teamcap/ui/components/card";

import Loader from "@/components/loader";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsRoute,
});

function AnalyticsRoute() {
  const user = useUser();
  const analytics = useQuery({
    ...orpc.workspaceAnalytics.queryOptions(),
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
            <CardDescription className="uppercase tracking-[0.2em]">Analytics</CardDescription>
            <CardTitle className="text-2xl">Sign in to view workspace analytics</CardTitle>
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

  if (analytics.isLoading || !analytics.data) {
    return <Loader />;
  }

  const data = analytics.data;

  return (
    <div className="flex w-full flex-col gap-6 py-6">
      <Card>
        <CardHeader>
          <CardDescription className="uppercase tracking-[0.2em]">Analytics</CardDescription>
          <CardTitle className="text-3xl">{data.workspace.name} ownership and approval health</CardTitle>
          <CardDescription>
            Funding stage: {formatToken(data.workspace.fundingStage)}. Total equity pool tracked:{" "}
            {(data.workspace.totalEquityBasisPoints / 100).toFixed(2)}%.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Contracts Approved"
          value={String(data.approvalMetrics.contractsApproved)}
          detail={`${data.approvalMetrics.contractsPending} contract approvals still pending`}
        />
        <MetricCard
          label="Tasks Approved"
          value={String(data.approvalMetrics.tasksApproved)}
          detail={`${data.approvalMetrics.tasksPending} task approvals still pending`}
        />
        <MetricCard
          label="Founder Seats"
          value={String(data.memberMix.find((entry) => entry.memberType === "founder")?.count ?? 0)}
          detail="Founders hold unanimous consent on equity-bearing tasks"
        />
        <MetricCard
          label="Community Equity Eligible"
          value={String(data.memberMix.find((entry) => entry.memberType === "community")?.equityEligible ?? 0)}
          detail="Founding community members eligible for approved equity grants"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardDescription className="uppercase tracking-[0.2em]">Member Mix</CardDescription>
            <CardTitle className="text-2xl">Who is in the workspace</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.memberMix.map((entry) => (
              <div key={entry.memberType} className="border-border flex items-center justify-between border p-3">
                <div>
                  <p className="font-medium">{formatToken(entry.memberType)}</p>
                  <p className="text-muted-foreground">{entry.equityEligible} equity eligible</p>
                </div>
                <p className="text-2xl font-medium">{entry.count}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription className="uppercase tracking-[0.2em]">Cap Table</CardDescription>
            <CardTitle className="text-2xl">Approved ownership split</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.capTable.map((entry) => (
              <div key={entry.memberId} className="border-border flex flex-col gap-2 border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{entry.fullName}</p>
                    <p className="text-muted-foreground">
                      {entry.roleTitle}, {formatToken(entry.memberType)}
                    </p>
                  </div>
                  <p className="font-medium">{entry.ownershipPercent}%</p>
                </div>
                <div className="bg-muted h-2 w-full">
                  <div className="bg-primary h-2" style={{ width: `${Math.min(entry.ownershipPercent, 100)}%` }} />
                </div>
                <p className="text-muted-foreground">
                  {(entry.approvedBasisPoints / 100).toFixed(2)}% approved
                  {entry.cashInvestmentCents ? `, ${formatCurrency(entry.cashInvestmentCents)} invested` : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardDescription className="uppercase tracking-[0.2em]">Equity Sources</CardDescription>
            <CardTitle className="text-2xl">Where ownership comes from</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.sourceBreakdown.map((source) => (
              <div key={source.sourceType} className="border-border flex flex-col gap-2 border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{source.label}</p>
                  <p className="text-muted-foreground uppercase tracking-[0.2em]">{formatToken(source.sourceType)}</p>
                </div>
                <p className="text-muted-foreground">
                  Approved: {(source.approvedBasisPoints / 100).toFixed(2)}%, proposed: {(source.proposedBasisPoints / 100).toFixed(2)}%, grants: {source.grants}
                </p>
                <p className="text-muted-foreground">
                  {source.cashInvestmentCents ? `${formatCurrency(source.cashInvestmentCents)} direct investment` : "No direct cash recorded"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription className="uppercase tracking-[0.2em]">Task Status</CardDescription>
            <CardTitle className="text-2xl">Execution pipeline</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.taskStatusBreakdown.map((entry) => (
              <div key={entry.status} className="border-border flex items-center justify-between border p-3">
                <p className="font-medium">{formatToken(entry.status)}</p>
                <p className="text-2xl font-medium">{entry.count}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
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

function formatToken(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

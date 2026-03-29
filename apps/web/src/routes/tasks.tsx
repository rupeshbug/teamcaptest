import { SignInButton, useUser } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@teamcap/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@teamcap/ui/components/card";

import Loader from "@/components/loader";
import RichTextViewer from "@/components/rich-text-viewer";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/tasks")({
  component: TasksRoute,
});

function TasksRoute() {
  const user = useUser();
  const tasksQuery = useQuery({
    ...orpc.workspaceTasks.queryOptions(),
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
            <CardDescription className="uppercase tracking-[0.2em]">Tasks</CardDescription>
            <CardTitle className="text-2xl">Sign in to view task approvals</CardTitle>
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

  if (tasksQuery.isLoading || !tasksQuery.data) {
    return <Loader />;
  }

  const data = tasksQuery.data;

  return (
    <div className="flex w-full flex-col gap-6 py-6">
      <Card>
        <CardHeader>
          <CardDescription className="uppercase tracking-[0.2em]">Tasks</CardDescription>
          <CardTitle className="text-3xl">Contribution and approval workflow</CardTitle>
          <CardDescription>{data.workspace.summary}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardDescription className="uppercase tracking-[0.2em]">Approval Queue</CardDescription>
            <CardTitle className="text-2xl">Tasks waiting on founder consent</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.approvalQueue.map((task) => (
              <TaskApprovalCard key={task.id} task={task} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription className="uppercase tracking-[0.2em]">All Tasks</CardDescription>
            <CardTitle className="text-2xl">Execution tied to ownership and rewards</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.tasks.map((task) => (
              <div key={task.id} className="border-border grid gap-4 border p-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-muted-foreground">{task.summary}</p>
                    </div>
                    <p className="text-muted-foreground uppercase tracking-[0.2em]">{formatToken(task.status)}</p>
                  </div>
                  <p className="text-muted-foreground">
                    Assignee: {task.assigneeName ?? "Unassigned"}
                    {task.assigneeRole ? `, ${task.assigneeRole}` : ""}
                  </p>
                  <p className="text-muted-foreground">
                    Reward: {formatReward(task.rewardType, task.equityBasisPoints, task.cashRewardCents)}
                  </p>
                  <p className="text-muted-foreground">
                    Founder approval: {task.requiresFounderApproval ? `${task.approvalProgress.approved}/${task.approvalProgress.required} approved` : "Not required"}
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  <RichTextViewer blocks={task.description} />
                  {task.approvals.length ? (
                    <div className="flex flex-col gap-2">
                      <p className="font-medium">Approvals</p>
                      {task.approvals.map((approval) => (
                        <div key={approval.memberId} className="border-border flex items-start justify-between gap-3 border p-3">
                          <div>
                            <p className="font-medium">{approval.memberName}</p>
                            {approval.note ? <p className="text-muted-foreground">{approval.note}</p> : null}
                          </div>
                          <p className="text-muted-foreground uppercase tracking-[0.2em]">{approval.decision}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TaskApprovalCard({
  task,
}: {
  task: {
    title: string;
    summary: string;
    assigneeName: string | null;
    rewardType: string;
    equityBasisPoints: number | null;
    cashRewardCents: number | null;
    approvalProgress: { approved: number; required: number; pending: number; rejected: number };
  };
}) {
  return (
    <div className="border-border flex flex-col gap-2 border p-3">
      <p className="font-medium">{task.title}</p>
      <p className="text-muted-foreground">{task.summary}</p>
      <p className="text-muted-foreground">Assignee: {task.assigneeName ?? "Unassigned"}</p>
      <p className="text-muted-foreground">
        Reward: {formatReward(task.rewardType, task.equityBasisPoints, task.cashRewardCents)}
      </p>
      <p className="text-muted-foreground">
        Approval state: {task.approvalProgress.approved}/{task.approvalProgress.required} approved, {task.approvalProgress.pending} pending, {task.approvalProgress.rejected} rejected
      </p>
    </div>
  );
}

function formatToken(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatReward(rewardType: string, equityBasisPoints: number | null, cashRewardCents: number | null) {
  const parts = [];

  if (rewardType === "equity" || rewardType === "equity_and_cash") {
    parts.push(equityBasisPoints ? `${(equityBasisPoints / 100).toFixed(2)}% equity` : "Equity");
  }

  if (rewardType === "cash" || rewardType === "equity_and_cash") {
    parts.push(
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format((cashRewardCents ?? 0) / 100),
    );
  }

  return parts.length ? parts.join(" + ") : "No explicit reward";
}

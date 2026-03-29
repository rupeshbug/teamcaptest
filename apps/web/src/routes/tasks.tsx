import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@teamcap/ui/components/card";

export const Route = createFileRoute("/tasks")({
  component: TasksRoute,
});

function TasksRoute() {
  return (
    <div className="flex w-full flex-col gap-6 px-0 py-6">
      <Card>
        <CardHeader>
          <CardDescription className="uppercase tracking-[0.2em]">Tasks</CardDescription>
          <CardTitle className="text-2xl">Task management is coming next</CardTitle>
          <CardDescription>
            This page is ready for your team task list, assignments, and workflow views.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground border-border bg-muted/30 rounded-none border border-dashed px-4 py-8">
            Add task creation, statuses, assignees, and due dates here when you are ready.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

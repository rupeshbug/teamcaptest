import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@teamcap/ui/components/card";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsRoute,
});

function AnalyticsRoute() {
  return (
    <div className="flex w-full flex-col gap-6 px-0 py-6">
      <Card>
        <CardHeader>
          <CardDescription className="uppercase tracking-[0.2em]">Analytics</CardDescription>
          <CardTitle className="text-2xl">Team insights will live here</CardTitle>
          <CardDescription>
            Use this page for activity trends, delivery metrics, and workspace reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground border-border bg-muted/30 rounded-none border border-dashed px-4 py-8">
            Connect charts and summary metrics once your task and team data model is ready.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

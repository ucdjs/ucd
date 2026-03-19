import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  executions: {
    workspacesViaEvents: r.many.workspaces({
      from: r.executions.id.through(r.events.executionId),
      to: r.workspaces.id.through(r.events.workspaceId),
      alias: "executions_id_workspaces_id_via_events",
    }),
    workspacesViaExecutionLogs: r.many.workspaces({
      from: r.executions.id.through(r.executionLogs.executionId),
      to: r.workspaces.id.through(r.executionLogs.workspaceId),
      alias: "executions_id_workspaces_id_via_executionLogs",
    }),
    workspace: r.one.workspaces({
      from: r.executions.workspaceId,
      to: r.workspaces.id,
      alias: "executions_workspaceId_workspaces_id",
    }),
  },
  workspaces: {
    executionsViaEvents: r.many.executions({
      alias: "executions_id_workspaces_id_via_events",
    }),
    executionsViaExecutionLogs: r.many.executions({
      alias: "executions_id_workspaces_id_via_executionLogs",
    }),
    executionsWorkspaceId: r.many.executions({
      alias: "executions_workspaceId_workspaces_id",
    }),
  },
}));

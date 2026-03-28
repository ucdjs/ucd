import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  executions: {
    workspacesViaExecutionLogs: r.many.workspaces({
      from: r.executions.id.through(r.executionLogs.executionId),
      to: r.workspaces.id.through(r.executionLogs.workspaceId),
      alias: "executions_id_workspaces_id_via_executionLogs",
    }),
    workspacesViaExecutionTraces: r.many.workspaces({
      from: r.executions.id.through(r.executionTraces.executionId),
      to: r.workspaces.id.through(r.executionTraces.workspaceId),
      alias: "executions_id_workspaces_id_via_executionTraces",
    }),
    workspace: r.one.workspaces({
      from: r.executions.workspaceId,
      to: r.workspaces.id,
      alias: "executions_workspaceId_workspaces_id",
    }),
  },
  workspaces: {
    executionsViaExecutionLogs: r.many.executions({
      alias: "executions_id_workspaces_id_via_executionLogs",
    }),
    executionsViaExecutionTraces: r.many.executions({
      alias: "executions_id_workspaces_id_via_executionTraces",
    }),
    executionsWorkspaceId: r.many.executions({
      alias: "executions_workspaceId_workspaces_id",
    }),
  },
}));

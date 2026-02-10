import type { PipelineRouteDefinition } from "./route";
import { isArtifactDependency, isRouteDependency, parseDependency } from "./dependencies";

export interface DAGNode {
  id: string;
  dependencies: Set<string>;
  dependents: Set<string>;
  emittedArtifacts: Set<string>;
}

export interface DAG {
  nodes: Map<string, DAGNode>;
  executionOrder: string[];
}

export interface DAGValidationError {
  type: "cycle" | "missing-route" | "missing-artifact" | "duplicate-route";
  message: string;
  details: {
    routeId?: string;
    dependencyId?: string;
    cycle?: string[];
  };
}

export interface DAGValidationResult {
  valid: boolean;
  errors: DAGValidationError[];
  dag?: DAG;
}

export function buildDAG(routes: readonly PipelineRouteDefinition<any, any, any, any, any>[]): DAGValidationResult {
  const errors: DAGValidationError[] = [];
  const nodes = new Map<string, DAGNode>();
  const artifactsByRoute = new Map<string, Set<string>>();

  const seenIds = new Map<string, number>();
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    if (!route) continue;
    const id = route.id;
    if (seenIds.has(id)) {
      errors.push({
        type: "duplicate-route",
        message: `Duplicate route ID "${id}" found at index ${seenIds.get(id)} and ${i}`,
        details: { routeId: id },
      });
    } else {
      seenIds.set(id, i);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const routeIds = new Set(routes.map((r) => r.id));

  for (const route of routes) {
    const emittedArtifacts = new Set<string>();
    if (route.emits) {
      for (const artifactName of Object.keys(route.emits)) {
        emittedArtifacts.add(`${route.id}:${artifactName}`);
      }
    }
    artifactsByRoute.set(route.id, emittedArtifacts);

    nodes.set(route.id, {
      id: route.id,
      dependencies: new Set(),
      dependents: new Set(),
      emittedArtifacts,
    });
  }

  for (const route of routes) {
    const node = nodes.get(route.id)!;

    if (!route.depends) continue;

    for (const dep of route.depends) {
      const parsed = parseDependency(dep);

      if (isRouteDependency(dep)) {
        if (!routeIds.has(parsed.routeId)) {
          errors.push({
            type: "missing-route",
            message: `Route "${route.id}" depends on non-existent route "${parsed.routeId}"`,
            details: { routeId: route.id, dependencyId: parsed.routeId },
          });
          continue;
        }
        node.dependencies.add(parsed.routeId);
        nodes.get(parsed.routeId)!.dependents.add(route.id);
      } else if (isArtifactDependency(dep)) {
        if (parsed.type !== "artifact") continue;

        if (!routeIds.has(parsed.routeId)) {
          errors.push({
            type: "missing-route",
            message: `Route "${route.id}" depends on artifact from non-existent route "${parsed.routeId}"`,
            details: { routeId: route.id, dependencyId: parsed.routeId },
          });
          continue;
        }

        const routeArtifacts = artifactsByRoute.get(parsed.routeId);
        const artifactKey = `${parsed.routeId}:${parsed.artifactName}`;
        if (!routeArtifacts?.has(artifactKey)) {
          errors.push({
            type: "missing-artifact",
            message: `Route "${route.id}" depends on non-existent artifact "${parsed.artifactName}" from route "${parsed.routeId}"`,
            details: { routeId: route.id, dependencyId: artifactKey },
          });
          continue;
        }

        node.dependencies.add(parsed.routeId);
        nodes.get(parsed.routeId)!.dependents.add(route.id);
      }
    }
  }

  const cycleResult = detectCycle(nodes);
  if (cycleResult) {
    errors.push({
      type: "cycle",
      message: `Circular dependency detected: ${cycleResult.join(" -> ")}`,
      details: { cycle: cycleResult },
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const executionOrder = topologicalSort(nodes);

  return {
    valid: true,
    errors: [],
    dag: { nodes, executionOrder },
  };
}

function detectCycle(nodes: Map<string, DAGNode>): string[] | null {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(nodeId: string): string[] | null {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const node = nodes.get(nodeId);
    if (node) {
      for (const depId of node.dependencies) {
        if (!visited.has(depId)) {
          const cycle = dfs(depId);
          if (cycle) return cycle;
        } else if (recursionStack.has(depId)) {
          const cycleStart = path.indexOf(depId);
          return [...path.slice(cycleStart), depId];
        }
      }
    }

    path.pop();
    recursionStack.delete(nodeId);
    return null;
  }

  for (const nodeId of nodes.keys()) {
    if (!visited.has(nodeId)) {
      const cycle = dfs(nodeId);
      if (cycle) return cycle;
    }
  }

  return null;
}

function topologicalSort(nodes: Map<string, DAGNode>): string[] {
  const result: string[] = [];
  const visited = new Set<string>();
  const temp = new Set<string>();

  function visit(nodeId: string): void {
    if (temp.has(nodeId)) return;
    if (visited.has(nodeId)) return;

    temp.add(nodeId);

    const node = nodes.get(nodeId);
    if (node) {
      for (const depId of node.dependencies) {
        visit(depId);
      }
    }

    temp.delete(nodeId);
    visited.add(nodeId);
    result.push(nodeId);
  }

  for (const nodeId of nodes.keys()) {
    if (!visited.has(nodeId)) {
      visit(nodeId);
    }
  }

  return result;
}

export function getExecutionLayers(dag: DAG): string[][] {
  const layers: string[][] = [];
  const scheduled = new Set<string>();
  const remaining = new Set(dag.nodes.keys());

  while (remaining.size > 0) {
    const layer: string[] = [];

    for (const nodeId of remaining) {
      const node = dag.nodes.get(nodeId)!;
      const allDepsScheduled = [...node.dependencies].every((dep) => scheduled.has(dep));
      if (allDepsScheduled) {
        layer.push(nodeId);
      }
    }

    if (layer.length === 0) {
      break;
    }

    for (const nodeId of layer) {
      remaining.delete(nodeId);
      scheduled.add(nodeId);
    }

    layers.push(layer);
  }

  return layers;
}

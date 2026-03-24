import type { Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { applyLayeredLayout } from "../../src/client/lib/graph-layout";

function node(id: string): Node {
  return { id, position: { x: 0, y: 0 }, data: {}, width: 200, height: 56 };
}

function edge(source: string, target: string) {
  return { id: `${source}->${target}`, source, target };
}

const layoutOptions = { nodeWidth: 200, nodeHeight: 56 };

describe("applyLayeredLayout", () => {
  it("returns an empty array for no nodes", () => {
    expect(applyLayeredLayout([], [], layoutOptions)).toEqual([]);
  });

  it("positions a single node", () => {
    const result = applyLayeredLayout([node("a")], [], layoutOptions);
    expect(result).toHaveLength(1);
    expect(result[0]!.position.x).toBe(0);
  });

  it("places connected nodes in successive layers left to right", () => {
    const nodes = [node("a"), node("b"), node("c")];
    const edges = [edge("a", "b"), edge("b", "c")];
    const result = applyLayeredLayout(nodes, edges, layoutOptions);

    const xs = result.map((n) => n.position.x);
    expect(xs[0]).toBeLessThan(xs[1]!);
    expect(xs[1]).toBeLessThan(xs[2]!);
  });

  it("places independent nodes in the same layer", () => {
    const nodes = [node("a"), node("b")];
    const result = applyLayeredLayout(nodes, [], layoutOptions);

    expect(result[0]!.position.x).toBe(result[1]!.position.x);
    expect(result[0]!.position.y).not.toBe(result[1]!.position.y);
  });

  it("uses custom gap options", () => {
    const nodes = [node("a"), node("b")];
    const edges = [edge("a", "b")];

    const defaultResult = applyLayeredLayout(nodes, edges, layoutOptions);
    const wideResult = applyLayeredLayout(nodes, edges, { ...layoutOptions, horizontalGap: 200 });

    const defaultGap = defaultResult[1]!.position.x - defaultResult[0]!.position.x;
    const wideGap = wideResult[1]!.position.x - wideResult[0]!.position.x;
    expect(wideGap).toBeGreaterThan(defaultGap);
  });

  it("handles diamond dependencies (a -> b, a -> c, b -> d, c -> d)", () => {
    const nodes = [node("a"), node("b"), node("c"), node("d")];
    const edges = [edge("a", "b"), edge("a", "c"), edge("b", "d"), edge("c", "d")];
    const result = applyLayeredLayout(nodes, edges, layoutOptions);

    const byId = new Map(result.map((n) => [n.id, n]));
    expect(byId.get("a")!.position.x).toBeLessThan(byId.get("b")!.position.x);
    expect(byId.get("b")!.position.x).toBeLessThan(byId.get("d")!.position.x);
    expect(byId.get("a")!.position.x).toBeLessThan(byId.get("c")!.position.x);
  });

  it("preserves node data through layout", () => {
    const nodes: Node[] = [{ ...node("a"), data: { kind: "route", routeId: "a" } }];
    const result = applyLayeredLayout(nodes, [], layoutOptions);
    expect(result[0]!.data).toEqual({ kind: "route", routeId: "a" });
  });

  it("ignores edges referencing nodes not in the list", () => {
    const nodes = [node("a"), node("b")];
    const edges = [edge("a", "b"), edge("a", "missing"), edge("ghost", "b")];
    const result = applyLayeredLayout(nodes, edges, layoutOptions);
    expect(result).toHaveLength(2);

    const byId = new Map(result.map((n) => [n.id, n]));
    expect(byId.get("a")!.position.x).toBeLessThan(byId.get("b")!.position.x);
  });
});

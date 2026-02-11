import { parseSync } from "oxc-parser";

export function getStaticImportSpecifiers(source: string, identifier?: string): string[] {
  let parsed: ReturnType<typeof parseSync>;
  try {
    parsed = parseSync(identifier ?? "<inline>", source, {
      sourceType: "module",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse module ${identifier ?? "<inline>"}: ${message}`);
  }

  const specifiers = new Set<string>();

  const visit = (value: unknown): void => {
    if (!value) {
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item);
      }
      return;
    }

    if (typeof value !== "object") {
      return;
    }

    const node = value as Record<string, unknown> & { type?: string };
    if (node.type === "ImportDeclaration") {
      const sourceNode = node.source as { value?: string } | undefined;
      if (sourceNode?.value) {
        specifiers.add(sourceNode.value);
      }
    } else if (node.type === "ExportAllDeclaration" || node.type === "ExportNamedDeclaration") {
      const sourceNode = node.source as { value?: string } | undefined;
      if (sourceNode?.value) {
        specifiers.add(sourceNode.value);
      }
    } else if (node.type === "ImportExpression") {
      const sourceNode = (node.source ?? node.argument) as { type?: string; value?: string } | undefined;
      if (sourceNode?.type === "StringLiteral" && sourceNode.value) {
        specifiers.add(sourceNode.value);
      }
    }

    for (const [key, child] of Object.entries(node)) {
      if (key === "parent") {
        continue;
      }
      visit(child);
    }
  };

  visit(parsed.program);

  return Array.from(specifiers);
}

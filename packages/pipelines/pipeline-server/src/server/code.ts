import { print } from "esrap";
import ts from "esrap/languages/ts";
import { parseSync } from "oxc-parser";

interface ExportTarget {
  exportName: string;
}

export function extractDefinePipelineCode(source: string, { exportName }: ExportTarget): string {
  const { program } = parseSync("pipeline.ts", source, {
    sourceType: "module",
    lang: "ts",
  });

  const callExpression = findDefinePipelineExpression(program, exportName);
  if (!callExpression) {
    throw new Error(`definePipeline call not found for export "${exportName}"`);
  }

  try {
    const { code } = print(
      {
        type: "Program",
        sourceType: "module",
        body: [
          {
            type: "ExpressionStatement",
            expression: callExpression,
          },
        ],
      } as any,
      ts(),
    );

    return code.trim();
  } catch {
    const span = callExpression.span as { start: number; end: number } | undefined;
    if (span) {
      return source.slice(span.start, span.end).trim();
    }
    throw new Error("Failed to print definePipeline call");
  }
}

function findDefinePipelineExpression(program: any, exportName: string): any | null {
  const body = program.body as any[];

  for (const node of body) {
    if (node.type === "ExportNamedDeclaration") {
      if (node.declaration) {
        const expr = findDefinePipelineInDeclaration(node.declaration, exportName);
        if (expr) return expr;
      }

      if (node.specifiers?.length) {
        for (const spec of node.specifiers) {
          if (spec.exported?.name === exportName) {
            const localName = spec.local?.name ?? exportName;
            const expr = findVariableInitializer(body, localName);
            if (expr) return expr;
          }
        }
      }
    }
  }

  return findVariableInitializer(body, exportName);
}

function findDefinePipelineInDeclaration(declaration: any, exportName: string): any | null {
  if (declaration.type === "VariableDeclaration") {
    for (const decl of declaration.declarations ?? []) {
      const id = decl.id;
      if (id?.type === "Identifier" && id.name === exportName) {
        if (isDefinePipelineCall(decl.init)) return decl.init;
      }
    }
  }

  return null;
}

function findVariableInitializer(body: any[], name: string): any | null {
  for (const node of body) {
    if (node.type === "VariableDeclaration") {
      for (const decl of node.declarations ?? []) {
        const id = decl.id;
        if (id?.type === "Identifier" && id.name === name) {
          if (isDefinePipelineCall(decl.init)) return decl.init;
        }
      }
    }
  }

  return null;
}

function isDefinePipelineCall(node: any): boolean {
  return (
    node
    && node.type === "CallExpression"
    && node.callee?.type === "Identifier"
    && node.callee?.name === "definePipeline"
  );
}

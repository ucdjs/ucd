export interface PipelineDefinition {
  _type?: string;
  id: string;
  versions?: string[];
  inputs?: unknown[];
  routes?: unknown[];
  [key: string]: unknown;
}

export type NamedExportValue = PipelineDefinition | string;

export type NamedExportConfig = Record<string, NamedExportValue>;

export type PipelineModuleSourceNamed = string[] | NamedExportConfig;

export interface PipelineModuleSourceOptions {
  named?: PipelineModuleSourceNamed;
  definitions?: Record<string, Partial<PipelineDefinition>>;
  extraExports?: string;
  prelude?: string;
}

function isStringArray(value: PipelineModuleSourceNamed): value is string[] {
  return Array.isArray(value);
}

function isPipelineDefinition(value: NamedExportValue): value is PipelineDefinition {
  return typeof value === "object" && value !== null && "id" in value;
}

function buildDefinition(
  id: string,
  overrides?: Partial<PipelineDefinition>,
): string {
  const def: PipelineDefinition = {
    _type: "pipeline-definition",
    id,
    versions: ["16.0.0"],
    inputs: [],
    routes: [],
    ...overrides,
  };
  return JSON.stringify(def).replace(/"(\w+)":/g, "$1:");
}

function buildNamedExports(
  named: PipelineModuleSourceNamed,
  definitions: Record<string, Partial<PipelineDefinition>>,
): string {
  if (isStringArray(named)) {
    return named
      .map((name) => `export const ${name} = ${buildDefinition(name, definitions[name])};`)
      .join("\n\n");
  }

  return Object.entries(named)
    .map(([name, value]) => {
      const exportValue: string = isPipelineDefinition(value)
        ? buildDefinition(value.id, value)
        : value;
      return `export const ${name} = ${exportValue};`;
    })
    .join("\n\n");
}

export function createPipelineModuleSource(
  options: PipelineModuleSourceOptions = {},
): string {
  const { named = [], definitions = {}, extraExports, prelude } = options;

  const namedExports: string = buildNamedExports(named, definitions);
  const parts: string[] = [prelude, namedExports, extraExports].filter(Boolean) as string[];

  return parts.join("\n\n");
}

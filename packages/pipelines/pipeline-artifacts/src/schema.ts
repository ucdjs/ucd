import type { z } from "zod";

export interface Artifact<TSchema extends z.ZodType = z.ZodType> {
  _type: "artifact";
  schema: TSchema;
  scope: "version";
}

export interface GlobalArtifact<TSchema extends z.ZodType = z.ZodType> {
  _type: "global-artifact";
  schema: TSchema;
  scope: "global";
}

export type ArtifactDefinition<TSchema extends z.ZodType = z.ZodType> =
  | Artifact<TSchema>
  | GlobalArtifact<TSchema>;

export function artifact<TSchema extends z.ZodType>(
  schema: TSchema
): Artifact<TSchema>;

export function artifact<TSchema extends z.ZodType>(
  schema: TSchema,
  scope: "version"
): Artifact<TSchema>;

export function artifact<TSchema extends z.ZodType>(
  schema: TSchema,
  scope: "global"
): GlobalArtifact<TSchema>;

export function artifact<TSchema extends z.ZodType>(
  schema: TSchema,
  scope?: "version" | "global",
): ArtifactDefinition<TSchema> {
  if (scope === "global") {
    return {
      _type: "global-artifact",
      schema,
      scope: "global",
    };
  }
  return {
    _type: "artifact",
    schema,
    scope: "version",
  };
}

export type InferArtifactSchemaType<T extends ArtifactDefinition> =
  T extends ArtifactDefinition<infer TSchema> ? z.infer<TSchema> : never;

export type InferEmittedArtifacts<TEmits extends Record<string, ArtifactDefinition>> = {
  [K in keyof TEmits]: InferArtifactSchemaType<TEmits[K]>;
};

export function isGlobalArtifact<TSchema extends z.ZodType>(
  def: ArtifactDefinition<TSchema>,
): def is GlobalArtifact<TSchema> {
  return def._type === "global-artifact";
}

export function isVersionArtifact<TSchema extends z.ZodType>(
  def: ArtifactDefinition<TSchema>,
): def is Artifact<TSchema> {
  return def._type === "artifact";
}

export type {
  Artifact,
  GlobalArtifact,
  ArtifactDefinition,
  InferArtifactSchemaType,
  InferEmittedArtifacts,
} from "./schema";

export {
  artifact,
  isGlobalArtifact,
  isVersionArtifact,
} from "./schema";

export type {
  ArtifactBuildContext,
  PipelineArtifactDefinition,
  InferArtifactId,
  InferArtifactValue,
  InferArtifactsMap,
} from "./definition";

export {
  definePipelineArtifact,
  isPipelineArtifactDefinition,
} from "./definition";

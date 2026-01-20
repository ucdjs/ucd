export type {
  ArtifactBuildContext,
  InferArtifactId,
  InferArtifactsMap,
  InferArtifactValue,
  PipelineArtifactDefinition,
} from "./definition";

export {
  definePipelineArtifact,
  isPipelineArtifactDefinition,
} from "./definition";

export type {
  Artifact,
  ArtifactDefinition,
  GlobalArtifact,
  InferArtifactSchemaType,
  InferEmittedArtifacts,
} from "./schema";

export {
  artifact,
  isGlobalArtifact,
  isVersionArtifact,
} from "./schema";

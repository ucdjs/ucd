// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type {
  ExecuteResult,
  LoadError,
  PipelineDetails,
  PipelineInfo,
  PipelineResponse,
  PipelinesResponse,
} from "./types";

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
export {
  usePipeline,
  type UsePipelineOptions,
  type UsePipelineReturn,
} from "./hooks/use-pipeline";
export {
  usePipelines,
  type UsePipelinesOptions,
  type UsePipelinesReturn,
} from "./hooks/use-pipelines";
export {
  useExecute,
  type UseExecuteOptions,
  type UseExecuteReturn,
} from "./hooks/use-execute";

// ---------------------------------------------------------------------------
// Sidebar Components
// ---------------------------------------------------------------------------
export {
  PipelineSidebar,
  PipelineSidebarErrors,
  PipelineSidebarHeader,
  PipelineSidebarItem,
  PipelineSidebarList,
  type PipelineSidebarErrorsProps,
  type PipelineSidebarHeaderProps,
  type PipelineSidebarItemProps,
  type PipelineSidebarListProps,
  type PipelineSidebarProps,
} from "./components/pipeline-sidebar";

// ---------------------------------------------------------------------------
// Pipeline Detail Components
// ---------------------------------------------------------------------------
export {
  RouteItem,
  RouteList,
  SourceItem,
  SourceList,
  VersionSelector,
  VersionTag,
  useVersionSelection,
  type RouteItemProps,
  type RouteListProps,
  type SourceItemProps,
  type SourceListProps,
  type UseVersionSelectionReturn,
  type VersionSelectorProps,
  type VersionTagProps,
} from "./components/pipeline-detail";

// ---------------------------------------------------------------------------
// Execution Components
// ---------------------------------------------------------------------------
export {
  ExecutionErrors,
  ExecutionResult,
  ExecutionSummary,
  type ExecutionErrorsProps,
  type ExecutionResultProps,
  type ExecutionSummaryProps,
} from "./components/execution-result";

// ---------------------------------------------------------------------------
// Pipeline Graph Components (existing)
// ---------------------------------------------------------------------------
export { PipelineGraphDetails, type PipelineGraphDetailsProps } from "./components/details";
export { PipelineGraphFilters, type PipelineGraphFiltersProps } from "./components/filters";
export { nodeTypes } from "./components/node-types";
export {
  ArtifactNode,
  FileNode,
  OutputNode,
  RouteNode,
  SourceNode,
  type PipelineNodeData,
} from "./components/nodes";
export { PipelineGraph, type PipelineGraphProps } from "./components/pipeline-graph";

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
export {
  filterNodesByType,
  pipelineGraphToFlow,
  type PipelineFlowEdge,
  type PipelineFlowNode,
} from "./lib/adapter";
export { getNodeColor, nodeTypeColors } from "./lib/colors";
export { applyLayout, NODE_HEIGHT, NODE_WIDTH } from "./lib/layout";
export { cn } from "./lib/utils";

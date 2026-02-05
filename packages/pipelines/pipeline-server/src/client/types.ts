import type { PipelineEvent } from "@ucdjs/pipelines-core";
import type { ExecuteResult, PipelineDetails, PipelineInfo, PipelinesResponse } from "@ucdjs/pipelines-ui";

export interface PipelinesContextValue {
  data: PipelinesResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface PipelineExecutionState {
  result: ExecuteResult | null;
  events: PipelineEvent[];
  executing: boolean;
  error: string | null;
}

export interface PipelineDetailContextValue {
  pipeline: PipelineDetails | null;
  loading: boolean;
  error: string | null;
  execution: PipelineExecutionState;
  selectedVersions: Set<string>;
  setSelectedVersions: (versions: Set<string>) => void;
  toggleVersion: (version: string) => void;
  selectAllVersions: () => void;
  deselectAllVersions: () => void;
  executePipeline: () => Promise<void>;
}

export interface PipelineTab {
  readonly id: string;
  readonly label: string;
  readonly to: string;
  readonly exact?: boolean;
}

export interface LogEventDisplayProps {
  event: PipelineEvent;
  index: number;
}

export interface RouteListItemProps {
  route: PipelineDetails["routes"][number];
  isSelected: boolean;
  onClick: () => void;
}

export interface CodeResponse {
  code?: string;
  filePath?: string;
  error?: string;
}

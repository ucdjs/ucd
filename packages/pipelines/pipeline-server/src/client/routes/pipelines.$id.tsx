import { createFileRoute } from "@tanstack/react-router";
import {
  ExecutionResult,
  RouteList,
  SourceList,
  useExecute,
  usePipeline,
  VersionSelector,
} from "@ucdjs/pipelines-ui";
import { memo, useCallback, useEffect, useState } from "react";

const PipelineDetailPage = memo(() => {
  const { id } = Route.useParams();
  const { pipeline, loading, error } = usePipeline(id);
  const { execute, executing, result } = useExecute();

  // Selected versions state
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set());

  // Sync selected versions when pipeline loads
  useEffect(() => {
    if (pipeline) {
      setSelectedVersions(new Set(pipeline.versions));
    }
  }, [pipeline]);

  // Version toggle handler
  const handleToggleVersion = useCallback((version: string) => {
    setSelectedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  }, []);

  // Select all versions
  const handleSelectAll = useCallback(() => {
    if (pipeline) {
      setSelectedVersions(new Set(pipeline.versions));
    }
  }, [pipeline]);

  // Deselect all versions
  const handleDeselectAll = useCallback(() => {
    setSelectedVersions(new Set());
  }, []);

  // Execute handler
  const handleExecute = useCallback(async () => {
    if (!pipeline || selectedVersions.size === 0) return;
    await execute(id, Array.from(selectedVersions));
  }, [execute, id, pipeline, selectedVersions]);

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Loading pipeline...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-400 mb-2">{error}</p>
          <p className="text-xs text-zinc-500">
            Pipeline ID:
            {" "}
            {id}
          </p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!pipeline) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Pipeline not found</p>
      </div>
    );
  }

  const canExecute = selectedVersions.size > 0 && !executing;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-zinc-800 px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-medium text-zinc-100">
              {pipeline.name || pipeline.id}
            </h1>
            {pipeline.description && (
              <p className="text-sm text-zinc-500 mt-0.5">
                {pipeline.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleExecute}
            disabled={!canExecute}
            className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
              canExecute
                ? "bg-zinc-100 text-zinc-900 hover:bg-white"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {executing ? "Running..." : "Execute"}
          </button>
        </div>

        {/* Version selector */}
        <div className="mt-4">
          <VersionSelector
            versions={pipeline.versions}
            selectedVersions={selectedVersions}
            onToggleVersion={handleToggleVersion}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
          />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Execution result */}
        {result && <ExecutionResult result={result} />}

        {/* Routes */}
        <RouteList routes={pipeline.routes} />

        {/* Sources */}
        <SourceList sources={pipeline.sources} />
      </div>
    </div>
  );
});

export const Route = createFileRoute("/pipelines/$id")({
  component: PipelineDetailPage,
});

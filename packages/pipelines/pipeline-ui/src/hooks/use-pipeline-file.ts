import type { PipelineFileInfo } from "../types";
import { useCallback, useEffect, useState } from "react";
import { fetchSourceFile } from "../functions/fetch-source-file";
import { ApiError } from "../functions/fetch-with-parse";

export interface PipelineFileResponse {
  file?: PipelineFileInfo;
  error?: string;
}

export interface UsePipelineFileOptions {
  baseUrl?: string;
  sourceId: string;
  fetchOnMount?: boolean;
}

export interface UsePipelineFileReturn {
  file: PipelineFileInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePipelineFile(
  fileId: string,
  options: UsePipelineFileOptions,
): UsePipelineFileReturn {
  const { baseUrl = "", sourceId, fetchOnMount = true } = options;

  const [file, setFile] = useState<PipelineFileInfo | null>(null);
  const [loading, setLoading] = useState(fetchOnMount);
  const [error, setError] = useState<string | null>(null);

  const fetchFile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await fetchSourceFile(baseUrl, sourceId, fileId);
      setFile(json.file ?? null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.response.error);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load pipeline file");
      }
      setFile(null);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, fileId, sourceId]);

  useEffect(() => {
    if (fetchOnMount) {
      fetchFile();
    }
  }, [fetchOnMount, fetchFile]);

  return {
    file,
    loading,
    error,
    refetch: fetchFile,
  };
}

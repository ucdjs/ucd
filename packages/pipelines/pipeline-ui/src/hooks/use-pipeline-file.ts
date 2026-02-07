import type { PipelineFileInfo } from "../types";
import { useCallback, useEffect, useState } from "react";

export interface PipelineFileResponse {
  file?: PipelineFileInfo;
  error?: string;
}

export interface UsePipelineFileOptions {
  baseUrl?: string;
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
  options: UsePipelineFileOptions = {},
): UsePipelineFileReturn {
  const { baseUrl = "", fetchOnMount = true } = options;

  const [file, setFile] = useState<PipelineFileInfo | null>(null);
  const [loading, setLoading] = useState(fetchOnMount);
  const [error, setError] = useState<string | null>(null);

  const fetchFile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl}/api/pipelines/${fileId}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json: PipelineFileResponse = await res.json();
      if (json.error) {
        setError(json.error);
        setFile(null);
      } else {
        setFile(json.file ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pipeline file");
      setFile(null);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, fileId]);

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

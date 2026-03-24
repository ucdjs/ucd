import { usePipelineVersions } from "#hooks/use-pipeline-versions";
import { act, renderHook } from "@testing-library/react-hooks";
import { describe, expect, it } from "vitest";

describe("usePipelineVersions", () => {
  it("loads stored versions and filters out invalid entries", () => {
    localStorage.setItem("ucd-versions-pipeline-a", JSON.stringify(["15.1.0", "bogus-version"]));

    const { result } = renderHook(() => usePipelineVersions("pipeline-a", ["16.0.0", "15.1.0"]));

    expect([...result.current.selectedVersions]).toEqual(["15.1.0"]);
  });

  it("falls back to all versions when storage data is invalid JSON", () => {
    localStorage.setItem("ucd-versions-pipeline-a", "{not-json");

    const { result } = renderHook(() => usePipelineVersions("pipeline-a", ["16.0.0", "15.1.0"]));

    expect([...result.current.selectedVersions]).toEqual(["16.0.0", "15.1.0"]);
  });

  it("updates localStorage when toggling versions", () => {
    const { result } = renderHook(() => usePipelineVersions("pipeline-a", ["16.0.0", "15.1.0"]));

    act(() => {
      result.current.toggleVersion("15.1.0");
    });

    expect([...result.current.selectedVersions]).toEqual(["16.0.0"]);
    expect(localStorage.getItem("ucd-versions-pipeline-a")).toBe(JSON.stringify(["16.0.0"]));
  });

  it("selects all versions when calling selectAll", () => {
    localStorage.setItem("ucd-versions-pipeline-a", JSON.stringify(["15.1.0"]));

    const { result } = renderHook(() => usePipelineVersions("pipeline-a", ["16.0.0", "15.1.0"]));

    act(() => {
      result.current.selectAll();
    });

    expect([...result.current.selectedVersions]).toEqual(["16.0.0", "15.1.0"]);
    expect(localStorage.getItem("ucd-versions-pipeline-a")).toBe(JSON.stringify(["16.0.0", "15.1.0"]));
  });

  it("clears all versions when calling deselectAll", () => {
    const { result } = renderHook(() => usePipelineVersions("pipeline-a", ["16.0.0", "15.1.0"]));

    act(() => {
      result.current.deselectAll();
    });

    expect([...result.current.selectedVersions]).toEqual([]);
    expect(localStorage.getItem("ucd-versions-pipeline-a")).toBe(JSON.stringify([]));
  });
});

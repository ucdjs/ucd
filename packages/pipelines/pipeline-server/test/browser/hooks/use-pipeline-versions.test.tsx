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

  it("sanitizes selectAll input before persisting", () => {
    const { result } = renderHook(() => usePipelineVersions("pipeline-a", ["16.0.0", "15.1.0"]));

    act(() => {
      result.current.selectAll(["15.1.0", "bogus-version"]);
    });

    expect([...result.current.selectedVersions]).toEqual(["15.1.0"]);
    expect(localStorage.getItem("ucd-versions-pipeline-a")).toBe(JSON.stringify(["15.1.0"]));
  });

  it("falls back to all versions when deselectAll would leave nothing selected", () => {
    const { result } = renderHook(() => usePipelineVersions("pipeline-a", ["16.0.0", "15.1.0"]));

    act(() => {
      result.current.deselectAll();
    });

    expect([...result.current.selectedVersions]).toEqual(["16.0.0", "15.1.0"]);
    expect(localStorage.getItem("ucd-versions-pipeline-a")).toBe(JSON.stringify(["16.0.0", "15.1.0"]));
  });

  it("uses the storage key override when persisting selections", () => {
    const { result } = renderHook(() => usePipelineVersions("pipeline-a", ["16.0.0", "15.1.0"], "shared-key"));

    act(() => {
      result.current.toggleVersion("15.1.0");
    });

    expect(localStorage.getItem("ucd-versions-shared-key")).toBe(JSON.stringify(["16.0.0"]));
    expect(localStorage.getItem("ucd-versions-pipeline-a")).toBeNull();
  });
});

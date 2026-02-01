import type { PipelineGraph as PipelineGraphType } from "@ucdjs/pipelines-core";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@ucdjs-internal/shared-ui/ui/breadcrumb";
import { PipelineGraph } from "@ucdjs/pipelines-ui";

export const Route = createFileRoute("/pipeline-graph")({
  component: PipelineGraphPage,
});

// Fake data for testing the visualization
const fakeGraph: PipelineGraphType = {
  nodes: [
    { id: "source-16.0.0", type: "source", version: "16.0.0" },
    { id: "file-ucd-linebreak", type: "file", file: { version: "16.0.0", dir: "ucd", path: "ucd/LineBreak.txt", name: "LineBreak.txt", ext: ".txt" } },
    { id: "file-ucd-unicodedata", type: "file", file: { version: "16.0.0", dir: "ucd", path: "ucd/UnicodeData.txt", name: "UnicodeData.txt", ext: ".txt" } },
    { id: "file-ucd-blocks", type: "file", file: { version: "16.0.0", dir: "ucd", path: "ucd/Blocks.txt", name: "Blocks.txt", ext: ".txt" } },
    { id: "file-emoji-data", type: "file", file: { version: "16.0.0", dir: "emoji", path: "emoji/emoji-data.txt", name: "emoji-data.txt", ext: ".txt" } },
    { id: "route-linebreak", type: "route", routeId: "linebreak" },
    { id: "route-unicodedata", type: "route", routeId: "unicode-data" },
    { id: "route-blocks", type: "route", routeId: "blocks" },
    { id: "route-emoji", type: "route", routeId: "emoji-properties" },
    { id: "artifact-linebreak-json", type: "artifact", artifactId: "linebreak.json" },
    { id: "artifact-characters-json", type: "artifact", artifactId: "characters.json" },
    { id: "artifact-blocks-json", type: "artifact", artifactId: "blocks.json" },
    { id: "artifact-emoji-json", type: "artifact", artifactId: "emoji.json" },
    { id: "output-0", type: "output", outputIndex: 0 },
    { id: "output-1", type: "output", outputIndex: 1 },
    { id: "output-2", type: "output", outputIndex: 2 },
    { id: "output-3", type: "output", outputIndex: 3 },
  ],
  edges: [
    { from: "source-16.0.0", to: "file-ucd-linebreak", type: "provides" },
    { from: "source-16.0.0", to: "file-ucd-unicodedata", type: "provides" },
    { from: "source-16.0.0", to: "file-ucd-blocks", type: "provides" },
    { from: "source-16.0.0", to: "file-emoji-data", type: "provides" },
    { from: "file-ucd-linebreak", to: "route-linebreak", type: "matched" },
    { from: "file-ucd-unicodedata", to: "route-unicodedata", type: "matched" },
    { from: "file-ucd-blocks", to: "route-blocks", type: "matched" },
    { from: "file-emoji-data", to: "route-emoji", type: "matched" },
    { from: "route-linebreak", to: "artifact-linebreak-json", type: "parsed" },
    { from: "route-unicodedata", to: "artifact-characters-json", type: "parsed" },
    { from: "route-blocks", to: "artifact-blocks-json", type: "parsed" },
    { from: "route-emoji", to: "artifact-emoji-json", type: "parsed" },
    { from: "artifact-linebreak-json", to: "output-0", type: "resolved" },
    { from: "artifact-characters-json", to: "output-1", type: "resolved" },
    { from: "artifact-blocks-json", to: "output-2", type: "resolved" },
    { from: "artifact-emoji-json", to: "output-3", type: "resolved" },
    // Cross-artifact dependency example
    { from: "artifact-characters-json", to: "artifact-emoji-json", type: "uses-artifact" },
  ],
};

function PipelineGraphPage() {
  return (
    <div className="flex flex-1 flex-col h-full">
      <header className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink render={<Link to="/">Home</Link>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Pipeline Graph</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex-1 min-h-0">
        <PipelineGraph
          graph={fakeGraph}
          onNodeSelect={(node) => {
            if (node) {
              console.log("Selected node:", node);
            }
          }}
        />
      </div>
    </div>
  );
}

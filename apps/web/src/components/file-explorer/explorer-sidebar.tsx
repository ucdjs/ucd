import { filesQueryOptions } from "#functions/files";
import { versionsQueryOptions } from "#functions/versions";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";
import { Skeleton } from "@ucdjs-internal/shared-ui/ui/skeleton";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { createContext, use, useState } from "react";
import { ExplorerTreeEntry } from "./explorer-entry";

interface ExplorerSidebarContextValue {
  currentPath: string;
  query: string;
}

const ExplorerSidebarContext = createContext<ExplorerSidebarContextValue | null>(null);

function useExplorerSidebar() {
  const ctx = use(ExplorerSidebarContext);
  if (!ctx) throw new Error("!Ctx");
  return ctx;
}

const normalize = (p: string) => p.replace(/^\/+/, "").replace(/\/$/, "");
const buildPath = (parent: string, name: string) => (normalize(parent) ? `${normalize(parent)}/${name}` : name);

export function ExplorerSidebar() {
  const params = useParams({ strict: false });
  const { data: versions } = useSuspenseQuery(versionsQueryOptions());
  const currentPath = normalize(typeof params._splat === "string" ? params._splat : "");
  const [query, setQuery] = useState("");

  const ctx: ExplorerSidebarContextValue = {
    currentPath,
    query,
  };
  const filtered = query ? versions.filter((v) => v.version.toLowerCase().includes(query.toLowerCase())) : versions;

  return (
    <ExplorerSidebarContext value={ctx}>
      <div className="flex h-full flex-col">
        <div className="px-4 py-2 sticky top-0 bg-background z-10">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter tree..." className="h-8 pl-8" />
          </div>
        </div>
        <div className="flex-1 overflow-auto px-2 pb-4">
          <div className="space-y-1">
            {filtered.map((v) => (
              <Node key={v.version} name={`v${v.version}`} path={v.version} isDirectory versionType={v.type} depth={0} />
            ))}
          </div>
        </div>
      </div>
    </ExplorerSidebarContext>
  );
}

interface NodeProps {
  name: string;
  path: string;
  isDirectory: boolean;
  versionType?: string;
  depth: number;
}

function Node({ name, path, isDirectory, versionType, depth }: NodeProps) {
  const navigate = useNavigate({ from: "/file-explorer/$" });
  const { currentPath, query } = useExplorerSidebar();

  // Each node manages its own expansion - only re-renders this node when toggled
  const shouldAutoExpand = currentPath.startsWith(`${path}/`) || currentPath === path;
  const [isExpanded, setIsExpanded] = useState(shouldAutoExpand);
  const showChildren = isDirectory && isExpanded && !query;

  return (
    <div>
      <ExplorerTreeEntry
        name={name}
        isDirectory={isDirectory}
        isExpanded={isExpanded}
        active={currentPath === path || currentPath.startsWith(`${path}/`)}
        indent={depth * 14 + 8}
        onSelect={() => navigate({ to: isDirectory ? "/file-explorer/$" : "/file-explorer/v/$", params: { _splat: path } })}
        leading={
          isDirectory
            ? (
                <button
                  type="button"
                  className="inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  {isExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                </button>
              )
            : (
                <span className="inline-flex size-4 items-center justify-center">
                  <ChevronRight className="size-3 opacity-0" />
                </span>
              )
        }
        trailing={versionType ? <Badge variant="secondary" className="text-[10px]">{versionType}</Badge> : undefined}
      />
      {showChildren && <ChildList path={path} depth={depth + 1} />}
    </div>
  );
}

function ChildList({ path, depth }: { path: string; depth: number }) {
  const { data, isLoading } = useQuery(filesQueryOptions({ path, statType: "directory" }));
  const { query } = useExplorerSidebar();

  if (isLoading) {
    return (
      <div className="space-y-2" style={{ marginLeft: depth * 14 + 8 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-3 w-40 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.type !== "directory") return <div className="text-xs text-muted-foreground px-2 py-1" style={{ marginLeft: depth * 14 + 8 }}>Failed</div>;

  const entries = query
    ? data.files.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
    : [...data.files.filter((e) => e.type === "directory"), ...data.files.filter((e) => e.type === "file")];

  if (!entries.length) return <div className="text-xs text-muted-foreground px-2 py-1" style={{ marginLeft: depth * 14 + 8 }}>No matches</div>;

  return (
    <div className="space-y-1">
      {entries.map((e) => (
        <Node key={e.name} name={e.name} path={buildPath(path, e.name)} isDirectory={e.type === "directory"} depth={depth} />
      ))}
    </div>
  );
}

ExplorerSidebar.Skeleton = () => (
  <div className="flex h-full flex-col">
    <div className="px-3 py-3">
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
    <div className="flex-1 space-y-2 px-3 pb-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded" />
          <Skeleton className="h-3 w-40 rounded" />
        </div>
      ))}
    </div>
  </div>
);

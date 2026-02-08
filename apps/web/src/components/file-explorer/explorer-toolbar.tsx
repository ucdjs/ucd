import type { SearchQueryParams } from "../../routes/file-explorer/$";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { cn } from "@ucdjs-internal/shared-ui";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@ucdjs-internal/shared-ui/ui/dropdown-menu";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";
import {
  Archive,
  ArrowUpDown,
  File,
  FileText,
  Filter,
  Folder,
  Grid3X3,
  List,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

export type ViewMode = "list" | "cards";

// Isolated search input - only re-renders when query changes
const SearchInput = memo(() => {
  const navigate = useNavigate({ from: "/file-explorer/$" });
  const query = useSearch({ from: "/file-explorer/$", select: (s) => s.query });

  const [localValue, setLocalValue] = useState(query || "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const trimmed = value.trim();
      navigate({
        search: (prev) => ({
          ...prev,
          query: trimmed || undefined,
        }),
      });
    }, 300);
  }, [navigate]);

  useEffect(() => {
    return () => {
      // If there is a pending timer, we will clear it.
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleClear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setLocalValue("");
    navigate({
      search: (prev) => ({
        ...prev,
        query: undefined,
      }),
    });
  }, [navigate]);

  return (
    <div className="relative flex-1 min-w-48 max-w-sm">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search files..."
        value={localValue}
        onChange={handleChange}
        className={cn(
          "pl-8 pr-8 h-8",
          query && "border-primary/50 bg-primary/5",
        )}
      />
      {localValue && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-destructive/10 hover:text-destructive"
          onClick={handleClear}
        >
          <X className="size-3" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  );
});
SearchInput.displayName = "SearchInput";

// Type filter dropdown - files/directories/all
const TypeFilter = memo(() => {
  const navigate = useNavigate({ from: "/file-explorer/$" });
  const filterType = useSearch({ from: "/file-explorer/$", select: (s) => s.type }) || "all";
  const isActive = filterType !== "all";

  const setType = useCallback((type: "all" | "files" | "directories" | undefined) => {
    navigate({
      search: (prev) => ({
        ...prev,
        type: type === "all" ? undefined : type,
      }),
    });
  }, [navigate]);

  const getIcon = () => {
    switch (filterType) {
      case "files":
        return <File className="size-4" />;
      case "directories":
        return <Folder className="size-4" />;
      default:
        return <Filter className="size-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={(props) => (
        <Button
          {...props}
          variant={isActive ? "secondary" : "outline"}
          size="sm"
          className={cn(
            "gap-1.5 h-8",
            isActive && "border-primary/50 bg-primary/10 hover:bg-primary/20",
          )}
        >
          {getIcon()}
          <span className="hidden sm:inline text-xs">
            {filterType === "all" ? "Type" : filterType === "files" ? "Files" : "Folders"}
          </span>
          {isActive && (
            <span
              role="button"
              className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5"
              onClick={(e) => {
                e.stopPropagation();
                setType(undefined);
              }}
            >
              <X className="size-3" />
            </span>
          )}
        </Button>
      )}
      >
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={filterType} onValueChange={(v) => setType(v as "all" | "files" | "directories")}>
            <DropdownMenuRadioItem value="all">
              All files
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="files">
              Files only
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="directories">
              Directories only
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
TypeFilter.displayName = "TypeFilter";

// Pattern/extension filter dropdown
const PatternFilter = memo(() => {
  const navigate = useNavigate({ from: "/file-explorer/$" });
  const pattern = useSearch({ from: "/file-explorer/$", select: (s) => s.pattern });
  const isActive = !!pattern;

  const setPattern = useCallback((newPattern: string | undefined) => {
    navigate({
      search: (prev) => ({
        ...prev,
        pattern: newPattern,
      }),
    });
  }, [navigate]);

  const commonPatterns = [
    { label: "All files", value: undefined, icon: <Filter className="size-4" /> },
    { label: "Text files", value: "*.txt", icon: <FileText className="size-4" /> },
    { label: "XML files", value: "*.xml", icon: <File className="size-4" /> },
    { label: "Zip archives", value: "*.zip", icon: <Archive className="size-4" /> },
  ];

  const currentPattern = commonPatterns.find((p) => p.value === pattern);
  const displayIcon = currentPattern?.icon || <FileText className="size-4" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={(props) => (
        <Button
          {...props}
          variant={isActive ? "secondary" : "outline"}
          size="sm"
          className={cn(
            "gap-1.5 h-8",
            isActive && "border-primary/50 bg-primary/10 hover:bg-primary/20",
          )}
        >
          {displayIcon}
          <span className="hidden sm:inline text-xs">
            {pattern || "Extension"}
          </span>
          {isActive && (
            <span
              role="button"
              className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5"
              onClick={(e) => {
                e.stopPropagation();
                setPattern(undefined);
              }}
            >
              <X className="size-3" />
            </span>
          )}
        </Button>
      )}
      >
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Extension</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={pattern || ""} onValueChange={(v) => setPattern(v || undefined)}>
            {commonPatterns.map((p) => (
              <DropdownMenuRadioItem key={p.value || "all"} value={p.value || ""}>
                <span className="mr-2">{p.icon}</span>
                {p.label}
                {p.value && <span className="ml-auto text-xs text-muted-foreground">{p.value}</span>}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
PatternFilter.displayName = "PatternFilter";

// Sort dropdown with field and order combined
const SortControl = memo(() => {
  const navigate = useNavigate({ from: "/file-explorer/$" });
  const sort = useSearch({ from: "/file-explorer/$", select: (s) => s.sort }) || "name";
  const order = useSearch({ from: "/file-explorer/$", select: (s) => s.order }) || "asc";

  const setSort = useCallback((newSort: Required<SearchQueryParams["sort"]>) => {
    navigate({
      search: (prev) => ({
        ...prev,
        sort: newSort,
      }),
    });
  }, [navigate]);

  const toggleOrder = useCallback(() => {
    navigate({
      search: (prev) => ({
        ...prev,
        order: order === "asc" ? "desc" : "asc",
      }),
    });
  }, [navigate, order]);

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger render={(props) => (
          <Button
            {...props}
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 rounded-r-none border-r-0"
          >
            <ArrowUpDown className="size-4" />
            <span className="hidden sm:inline text-xs">
              {sort === "name" ? "Name" : "Modified"}
            </span>
          </Button>
        )}
        >
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v)}>
              <DropdownMenuRadioItem value="name">
                Name
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="lastModified">
                Last Modified
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="outline"
        size="icon-sm"
        className="rounded-l-none h-8"
        onClick={toggleOrder}
        title={order === "asc" ? "Ascending" : "Descending"}
      >
        {order === "asc"
          ? <TrendingUp className="size-4" />
          : <TrendingDown className="size-4" />}
        <span className="sr-only">
          {order === "asc" ? "Sort ascending" : "Sort descending"}
        </span>
      </Button>
    </div>
  );
});
SortControl.displayName = "SortControl";

// View mode toggle
const ViewModeToggle = memo(() => {
  const navigate = useNavigate({ from: "/file-explorer/$" });
  const viewMode = useSearch({ from: "/file-explorer/$", select: (s) => s.viewMode }) || "list";

  const setViewMode = useCallback((mode: ViewMode) => {
    navigate({
      search: (prev) => ({
        ...prev,
        viewMode: mode,
      }),
    });
  }, [navigate]);

  return (
    <div className="flex items-center border border-input rounded-lg overflow-hidden">
      <Button
        variant={viewMode === "list" ? "secondary" : "ghost"}
        size="icon-sm"
        onClick={() => setViewMode("list")}
        className="rounded-none border-0 h-8"
        title="List view"
      >
        <List className="size-4" />
        <span className="sr-only">List view</span>
      </Button>
      <Button
        variant={viewMode === "cards" ? "secondary" : "ghost"}
        size="icon-sm"
        onClick={() => setViewMode("cards")}
        className="rounded-none border-0 border-l border-input h-8"
        title="Grid view"
      >
        <Grid3X3 className="size-4" />
        <span className="sr-only">Grid view</span>
      </Button>
    </div>
  );
});
ViewModeToggle.displayName = "ViewModeToggle";

// Active filters summary with clear all
const ActiveFilters = memo(() => {
  const navigate = useNavigate({ from: "/file-explorer/$" });
  const query = useSearch({ from: "/file-explorer/$", select: (s) => s.query });
  const type = useSearch({ from: "/file-explorer/$", select: (s) => s.type });
  const pattern = useSearch({ from: "/file-explorer/$", select: (s) => s.pattern });

  const activeCount = [query, type, pattern].filter(Boolean).length;

  const clearAll = useCallback(() => {
    navigate({
      search: (prev) => ({
        ...prev,
        query: undefined,
        type: undefined,
        pattern: undefined,
      }),
    });
  }, [navigate]);

  if (activeCount === 0) return null;

  return (
    <Badge
      variant="secondary"
      className="gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
      onClick={clearAll}
    >
      <span className="text-xs">
        {activeCount}
        {" "}
        filter
        {activeCount > 1 ? "s" : ""}
      </span>
      <X className="size-3" />
    </Badge>
  );
});
ActiveFilters.displayName = "ActiveFilters";

export function ExplorerToolbar() {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <SearchInput />

      <div className="flex items-center gap-1.5">
        <TypeFilter />
        <PatternFilter />
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <ActiveFilters />
        <SortControl />
        <ViewModeToggle />
      </div>
    </div>
  );
}

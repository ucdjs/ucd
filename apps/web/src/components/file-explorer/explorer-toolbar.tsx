import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Filter, Grid3X3, List, Search, Settings, X } from "lucide-react";
import { memo, useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export type ViewMode = "list" | "cards";

// Isolated search input - only re-renders when query changes
const SearchInput = memo(() => {
  const navigate = useNavigate({ from: "/file-explorer/$" });
  const search = useSearch({ from: "/file-explorer/$", select: (s) => s.query });

  const [localValue, setLocalValue] = useState(search || "");
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
    <div className="relative flex-1 min-w-50 max-w-md">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search files..."
        value={localValue}
        onChange={handleChange}
        className="pl-8 pr-8"
      />
      {localValue && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute right-1 top-1/2 -translate-y-1/2"
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

// Isolated filter dropdown - only re-renders when type changes
const FilterDropdown = memo(() => {
  const navigate = useNavigate({ from: "/file-explorer/$" });
  const filterType = useSearch({ from: "/file-explorer/$", select: (s) => s.type }) || "all";

  const setType = useCallback((type: "all" | "files" | "directories" | undefined) => {
    navigate({
      search: (prev) => ({
        ...prev,
        type: type === "all" ? undefined : type,
      }),
    });
  }, [navigate]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-2.5 h-8 text-sm font-medium hover:bg-muted transition-colors"
      >
        <Filter className="size-4" />
        <span className="hidden sm:inline">
          {filterType === "all" ? "All" : filterType === "files" ? "Files" : "Directories"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setType(undefined)}>
            All
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setType("files")}>
            Files only
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setType("directories")}>
            Directories only
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
FilterDropdown.displayName = "FilterDropdown";

// Pattern filter dropdown - only re-renders when pattern changes
const PatternFilter = memo(() => {
  const navigate = useNavigate({ from: "/file-explorer/$" });
  const pattern = useSearch({ from: "/file-explorer/$", select: (s) => s.pattern });

  const setPattern = useCallback((newPattern: string | undefined) => {
    navigate({
      search: (prev) => ({
        ...prev,
        pattern: newPattern,
      }),
    });
  }, [navigate]);

  const commonPatterns = [
    { label: "All files", value: undefined },
    { label: "Text files (*.txt)", value: "*.txt" },
    { label: "XML files (*.xml)", value: "*.xml" },
    { label: "Zip files (*.zip)", value: "*.zip" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-2.5 h-8 text-sm font-medium hover:bg-muted transition-colors"
      >
        <Filter className="size-4" />
        <span className="hidden sm:inline text-xs">
          {pattern ? `${pattern}` : "All ext"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Filter by Extension</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {commonPatterns.map((p) => (
            <DropdownMenuItem
              key={p.value || "all"}
              onClick={() => setPattern(p.value)}
            >
              {p.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
PatternFilter.displayName = "PatternFilter";

// Isolated view mode toggle - only re-renders when viewMode changes
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
        className="rounded-none border-0"
      >
        <List className="size-4" />
        <span className="sr-only">List view</span>
      </Button>
      <Button
        variant={viewMode === "cards" ? "secondary" : "ghost"}
        size="icon-sm"
        onClick={() => setViewMode("cards")}
        className="rounded-none border-0 border-l border-input"
      >
        <Grid3X3 className="size-4" />
        <span className="sr-only">Card view</span>
      </Button>
    </div>
  );
});
ViewModeToggle.displayName = "ViewModeToggle";

// Sort by dropdown - only re-renders when sort param changes
const SortByDropdown = memo(() => {
  const navigate = useNavigate({ from: "/file-explorer/$" });
  const sort = useSearch({ from: "/file-explorer/$", select: (s) => s.sort }) || "name";

  const setSort = useCallback((newSort: "name" | "modified_date") => {
    navigate({
      search: (prev) => ({
        ...prev,
        sort: newSort,
      }),
    });
  }, [navigate]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-2.5 h-8 text-sm font-medium hover:bg-muted transition-colors"
        title="Sort by"
      >
        <Settings className="size-4" />
        <span className="hidden sm:inline text-xs">
          {sort === "name" ? "Name" : "Modified"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sort By</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSort("name")}>
            Name
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSort("modified_date")}>
            Last Modified
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
SortByDropdown.displayName = "SortByDropdown";

// Sort order toggle - only re-renders when order changes
const SortOrderToggle = memo(() => {
  const navigate = useNavigate({ from: "/file-explorer/$" });
  const order = useSearch({ from: "/file-explorer/$", select: (s) => s.order }) || "asc";

  const toggleOrder = useCallback(() => {
    navigate({
      search: (prev) => ({
        ...prev,
        order: order === "asc" ? "desc" : "asc",
      }),
    });
  }, [navigate, order]);

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={toggleOrder}
      title={`Sort ${order === "asc" ? "ascending" : "descending"}`}
    >
      {order === "asc"
        ? (
            <ArrowUp className="size-4" />
          )
        : (
            <ArrowDown className="size-4" />
          )}
      <span className="sr-only">
        {order === "asc" ? "Sort ascending" : "Sort descending"}
      </span>
    </Button>
  );
});
SortOrderToggle.displayName = "SortOrderToggle";

export function ExplorerToolbar() {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <SearchInput />
      <FilterDropdown />
      <PatternFilter />
      <SortByDropdown />
      <SortOrderToggle />
      <ViewModeToggle />
    </div>
  );
}

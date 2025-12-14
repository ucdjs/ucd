import { Filter, Grid3X3, List, Search, X } from "lucide-react";

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

export interface FileFilter {
  type: "all" | "files" | "directories";
  // Future filter options (mock for now)
  // extension?: string;
  // dateRange?: { from: Date; to: Date };
}

export interface ExplorerToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filter: FileFilter;
  onFilterChange: (filter: FileFilter) => void;
}

export function ExplorerToolbar({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filter,
  onFilterChange,
}: ExplorerToolbarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 pr-8"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={() => onSearchChange("")}
          >
            <X className="size-3" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-2.5 h-8 text-sm font-medium hover:bg-muted transition-colors"
        >
          <Filter className="size-4" />
          <span className="hidden sm:inline">
            {filter.type === "all" ? "All" : filter.type === "files" ? "Files" : "Directories"}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onFilterChange({ ...filter, type: "all" })}
            >
              All
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onFilterChange({ ...filter, type: "files" })}
            >
              Files only
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onFilterChange({ ...filter, type: "directories" })}
            >
              Directories only
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center border border-input rounded-lg overflow-hidden">
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => onViewModeChange("list")}
          className="rounded-none border-0"
        >
          <List className="size-4" />
          <span className="sr-only">List view</span>
        </Button>
        <Button
          variant={viewMode === "cards" ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => onViewModeChange("cards")}
          className="rounded-none border-0 border-l border-input"
        >
          <Grid3X3 className="size-4" />
          <span className="sr-only">Card view</span>
        </Button>
      </div>
    </div>
  );
}

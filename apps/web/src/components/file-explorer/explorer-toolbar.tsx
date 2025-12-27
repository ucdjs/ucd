import { Check, Filter, Grid3X3, List, Search, X } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "cards";

export interface FileFilter {
  type: "all" | "files" | "directories";
  extension?: string;
  sortBy?: "name" | "date" | "type";
  sortOrder?: "asc" | "desc";
}

export interface ExplorerToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filter: FileFilter;
  onFilterChange: (filter: FileFilter) => void;
  availableExtensions?: string[];
}

export function ExplorerToolbar({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filter,
  onFilterChange,
  availableExtensions = [],
}: ExplorerToolbarProps) {
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filter.type !== "all") count++;
    if (filter.extension) count++;
    if (filter.sortBy && filter.sortBy !== "name") count++;
    if (filter.sortOrder === "desc") count++;
    return count;
  }, [filter]);

  return (
    <div className="flex flex-col gap-2">
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
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-2.5 h-8 text-sm font-medium hover:bg-muted transition-colors relative"
          >
            <Filter className="size-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onFilterChange({ ...filter, type: "all" })}
                className={cn("justify-between", filter.type === "all" && "bg-accent")}
              >
                All
                {filter.type === "all" && <Check className="size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onFilterChange({ ...filter, type: "files" })}
                className={cn("justify-between", filter.type === "files" && "bg-accent")}
              >
                Files only
                {filter.type === "files" && <Check className="size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onFilterChange({ ...filter, type: "directories" })}
                className={cn("justify-between", filter.type === "directories" && "bg-accent")}
              >
                Directories only
                {filter.type === "directories" && <Check className="size-4" />}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            {availableExtensions.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Filter by Extension</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onFilterChange({ ...filter, extension: undefined })}
                    className={cn("justify-between", !filter.extension && "bg-accent")}
                  >
                    All extensions
                    {!filter.extension && <Check className="size-4" />}
                  </DropdownMenuItem>
                  {availableExtensions.slice(0, 10).map((ext) => (
                    <DropdownMenuItem
                      key={ext}
                      onClick={() => onFilterChange({ ...filter, extension: ext })}
                      className={cn("justify-between", filter.extension === ext && "bg-accent")}
                    >
                      .{ext}
                      {filter.extension === ext && <Check className="size-4" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onFilterChange({ ...filter, sortBy: "name" })}
                className={cn("justify-between", (!filter.sortBy || filter.sortBy === "name") && "bg-accent")}
              >
                Name
                {(!filter.sortBy || filter.sortBy === "name") && <Check className="size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onFilterChange({ ...filter, sortBy: "date" })}
                className={cn("justify-between", filter.sortBy === "date" && "bg-accent")}
              >
                Date modified
                {filter.sortBy === "date" && <Check className="size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onFilterChange({ ...filter, sortBy: "type" })}
                className={cn("justify-between", filter.sortBy === "type" && "bg-accent")}
              >
                Type
                {filter.sortBy === "type" && <Check className="size-4" />}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Order</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onFilterChange({ ...filter, sortOrder: "asc" })}
                className={cn("justify-between", (!filter.sortOrder || filter.sortOrder === "asc") && "bg-accent")}
              >
                Ascending
                {(!filter.sortOrder || filter.sortOrder === "asc") && <Check className="size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onFilterChange({ ...filter, sortOrder: "desc" })}
                className={cn("justify-between", filter.sortOrder === "desc" && "bg-accent")}
              >
                Descending
                {filter.sortOrder === "desc" && <Check className="size-4" />}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            {activeFiltersCount > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onFilterChange({ type: "all", sortBy: "name", sortOrder: "asc" })}
                  className="text-destructive"
                >
                  Clear all filters
                </DropdownMenuItem>
              </>
            )}
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

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {filter.type !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Type: {filter.type === "files" ? "Files" : "Directories"}
              <button
                onClick={() => onFilterChange({ ...filter, type: "all" })}
                className="hover:bg-muted rounded-full p-0.5"
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          )}
          {filter.extension && (
            <Badge variant="secondary" className="gap-1">
              Extension: .{filter.extension}
              <button
                onClick={() => onFilterChange({ ...filter, extension: undefined })}
                className="hover:bg-muted rounded-full p-0.5"
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          )}
          {filter.sortBy && filter.sortBy !== "name" && (
            <Badge variant="secondary" className="gap-1">
              Sort: {filter.sortBy === "date" ? "Date" : "Type"}
              <button
                onClick={() => onFilterChange({ ...filter, sortBy: "name" })}
                className="hover:bg-muted rounded-full p-0.5"
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          )}
          {filter.sortOrder === "desc" && (
            <Badge variant="secondary" className="gap-1">
              Order: Descending
              <button
                onClick={() => onFilterChange({ ...filter, sortOrder: "asc" })}
                className="hover:bg-muted rounded-full p-0.5"
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange({ type: "all", sortBy: "name", sortOrder: "asc" })}
            className="h-6 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

import type { Dispatch, SetStateAction } from "react";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ucdjs-internal/shared-ui/ui/dropdown-menu";
import { Input } from "@ucdjs-internal/shared-ui/ui/input";
import { Calendar, Filter, Search, X } from "lucide-react";

export type VersionTypeFilter = "all" | "stable" | "draft" | "unsupported";
export type AgeFilter = "all" | "recent" | "legacy";

export interface VersionFilters {
  query: string;
  typeFilter: VersionTypeFilter;
  ageFilter: AgeFilter;
}

interface VersionsToolbarProps {
  filters: VersionFilters;
  onFiltersChange: Dispatch<SetStateAction<VersionFilters>>;
}

export function VersionsToolbar({ filters, onFiltersChange }: VersionsToolbarProps) {
  const { query, typeFilter, ageFilter } = filters;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative flex-1 min-w-48 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search versions..."
          className="pl-8 pr-8 h-8"
          value={query}
          onChange={(e) => onFiltersChange((prev) => ({ ...prev, query: e.target.value }))}
        />
        {query && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onFiltersChange((prev) => ({ ...prev, query: "" }))}
          >
            <X className="size-3" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger render={(props) => (
            <Button
              {...props}
              variant={typeFilter !== "all" ? "secondary" : "outline"}
              size="sm"
              className="gap-1.5 h-8"
            >
              <Filter className="size-4" />
              <span className="hidden sm:inline text-xs">
                {typeFilter === "all" ? "Type" : typeFilter}
              </span>
              {typeFilter !== "all" && (
                <span
                  role="button"
                  className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFiltersChange((prev) => ({ ...prev, typeFilter: "all" }));
                  }}
                >
                  <X className="size-3" />
                </span>
              )}
            </Button>
          )}
          />
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={typeFilter}
                onValueChange={(v) => onFiltersChange((prev) => ({ ...prev, typeFilter: v as VersionTypeFilter }))}
              >
                <DropdownMenuRadioItem value="all">All types</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="stable">Stable</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="draft">Draft</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="unsupported">Unsupported</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger render={(props) => (
            <Button
              {...props}
              variant={ageFilter !== "all" ? "secondary" : "outline"}
              size="sm"
              className="gap-1.5 h-8"
            >
              <Calendar className="size-4" />
              <span className="hidden sm:inline text-xs">
                {ageFilter === "all" ? "Age" : ageFilter}
              </span>
              {ageFilter !== "all" && (
                <span
                  role="button"
                  className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFiltersChange((prev) => ({ ...prev, ageFilter: "all" }));
                  }}
                >
                  <X className="size-3" />
                </span>
              )}
            </Button>
          )}
          />
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Age</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={ageFilter}
                onValueChange={(v) => onFiltersChange((prev) => ({ ...prev, ageFilter: v as AgeFilter }))}
              >
                <DropdownMenuRadioItem value="all">All ages</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="recent">Recent</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="legacy">Legacy</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </div>
  );
}

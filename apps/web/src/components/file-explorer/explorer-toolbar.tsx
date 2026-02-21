import type { SearchQueryParams } from "../../lib/file-explorer";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { cn } from "@ucdjs-internal/shared-ui";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
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
import {
  ArrowUpDown,
  File,
  FileText,
  Filter,
  Folder,
  Grid3X3,
  List,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

export function ExplorerToolbar() {
  const navigate = useNavigate({ from: "/file-explorer/$" });
  const search = useSearch({ from: "/(explorer)/file-explorer/$", shouldThrow: false });

  const filterType = search?.type || "all";
  const pattern = search?.pattern;
  const sort = search?.sort || "name";
  const order = search?.order || "asc";

  const activeCount = [search?.query, search?.type, search?.pattern].filter(Boolean).length;

  const setSearch = (next: Partial<SearchQueryParams>) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...next,
      }),
    });
  };

  const toggleOrder = () => {
    setSearch({ order: order === "asc" ? "desc" : "asc" });
  };

  const clearAll = () => {
    setSearch({ query: undefined, type: undefined, pattern: undefined });
  };

  const typeLabel = filterType === "all" ? "Type" : filterType === "files" ? "Files" : "Folders";
  const typeIcon = filterType === "files"
    ? <File className="size-4" />
    : filterType === "directories"
      ? <Folder className="size-4" />
      : <Filter className="size-4" />;

  const commonPatterns = [
    { label: "All files", value: undefined, icon: <Filter className="size-4" /> },
    { label: "Text files", value: "*.txt", icon: <FileText className="size-4" /> },
    { label: "XML files", value: "*.xml", icon: <File className="size-4" /> },
  ];
  const currentPattern = commonPatterns.find((item) => item.value === pattern);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger render={(props) => (
            <Button
              {...props}
              variant={filterType !== "all" ? "secondary" : "outline"}
              size="sm"
              className={cn("gap-1.5 h-8", filterType !== "all" && "border-primary/50 bg-primary/10 hover:bg-primary/20")}
            >
              {typeIcon}
              <span className="hidden sm:inline text-xs">{typeLabel}</span>
              {filterType !== "all" && (
                <span
                  role="button"
                  className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSearch({ type: undefined });
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
              <DropdownMenuLabel>Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={filterType}
                onValueChange={(value) => setSearch({ type: value === "all" ? undefined : value as "files" | "directories" })}
              >
                <DropdownMenuRadioItem value="all">All files</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="files">Files only</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="directories">Directories only</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger render={(props) => (
            <Button
              {...props}
              variant={pattern ? "secondary" : "outline"}
              size="sm"
              className={cn("gap-1.5 h-8", pattern && "border-primary/50 bg-primary/10 hover:bg-primary/20")}
            >
              {currentPattern?.icon || <FileText className="size-4" />}
              <span className="hidden sm:inline text-xs">{pattern || "Extension"}</span>
              {pattern && (
                <span
                  role="button"
                  className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSearch({ pattern: undefined });
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
              <DropdownMenuLabel>Extension</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={pattern || ""}
                onValueChange={(value) => setSearch({ pattern: value || undefined })}
              >
                {commonPatterns.map((item) => (
                  <DropdownMenuRadioItem key={item.value || "all"} value={item.value || ""}>
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                    {item.value && <span className="ml-auto text-xs text-muted-foreground">{item.value}</span>}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-1.5">
        {activeCount > 0 && (
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
        )}

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
            />
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={sort}
                  onValueChange={(value) => setSearch({ sort: value as Required<SearchQueryParams["sort"]> })}
                >
                  <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="lastModified">Last Modified</DropdownMenuRadioItem>
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
      </div>
    </div>
  );
}

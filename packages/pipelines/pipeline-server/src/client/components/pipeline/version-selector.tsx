import { usePipelineVersions } from "#hooks/use-pipeline-versions";
import { cn } from "@ucdjs-internal/shared-ui";
import { buttonVariants } from "@ucdjs-internal/shared-ui/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ucdjs-internal/shared-ui/ui/dropdown-menu";
import { ChevronsUpDown } from "lucide-react";

export interface VersionSelectorProps {
  storageKey: string;
  versions: string[];
  className?: string;
}

export function VersionSelector({
  storageKey,
  versions,
  className,
}: VersionSelectorProps) {
  const { selectedVersions, toggleVersion, selectAll, deselectAll } = usePipelineVersions(storageKey, versions);
  const selectedCount = selectedVersions.size;
  const triggerLabel = selectedCount === 0
    ? "No versions"
    : selectedCount === versions.length
      ? "All versions"
      : `${selectedCount} selected`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), className)}
      >
        <span className="font-medium">Versions</span>
        <span className="text-muted-foreground">
          {selectedCount}
          /
          {versions.length}
        </span>
        <span className="hidden text-muted-foreground sm:inline">{triggerLabel}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between gap-2">
            <span>Versions</span>
            <span className="text-[11px] font-normal text-muted-foreground">
              {selectedCount}
              /
              {versions.length}
              {" "}
              selected
            </span>
          </DropdownMenuLabel>
          <>
            <DropdownMenuItem onClick={selectAll}>
              Select all
            </DropdownMenuItem>
            <DropdownMenuItem onClick={deselectAll}>
              Clear selection
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
          {versions.map((version, index) => (
            <DropdownMenuCheckboxItem
              key={`${version}-${index}`}
              checked={selectedVersions.has(version)}
              onClick={() => toggleVersion(version)}
            >
              {version}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

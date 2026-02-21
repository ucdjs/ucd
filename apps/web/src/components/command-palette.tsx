import { versionsQueryOptions } from "#functions/versions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@ucdjs-internal/shared-ui/ui/command";
import { FileCode, FolderOpen, Home, ScrollText } from "lucide-react";
import { useEffect, useState } from "react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { data: versions } = useSuspenseQuery(versionsQueryOptions());

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleNavigate = (path: string) => {
    navigate({ to: path });
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput
          placeholder="Type a command or search..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => handleNavigate("/")}>
              <Home className="mr-2 h-4 w-4" />
              Homepage
              <CommandShortcut>⌘H</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/file-explorer")}>
              <FolderOpen className="mr-2 h-4 w-4" />
              File Explorer
              <CommandShortcut>⌘F</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Versions">
            <CommandItem onSelect={() => handleNavigate("/versions")}>
              <ScrollText className="mr-2 h-4 w-4" />
              All Versions
            </CommandItem>
            {versions.map((version) => (
              <CommandItem key={version.version} onSelect={() => handleNavigate(`/v/${version.version}`)}>
                <FileCode className="mr-2 h-4 w-4" />
                {`Version ${version.version}`}
              </CommandItem>
            ))}

          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

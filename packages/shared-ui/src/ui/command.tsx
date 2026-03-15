import type { CommandAction } from "@cmdi/base-ui";
import { cn } from "#lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
} from "#ui/input-group";
import {
  Command as CommandPrimitive,
  createCommandPalette,
  useCommandActions,
  useCommandShortcutDefault,
} from "@cmdi/base-ui";
import { SearchIcon } from "lucide-react";
import * as React from "react";

const commandRootClassName = "bg-popover text-popover-foreground rounded-xl! p-1 flex size-full flex-col overflow-hidden";
const commandDialogOverlayClassName = "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 isolate z-50";
const commandDialogContentClassName = "bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 fixed top-1/3 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 translate-y-0 gap-4 overflow-hidden rounded-xl p-0 text-sm ring-1 duration-100 outline-none sm:max-w-sm";
const commandItemClassName = "data-selected:bg-muted data-selected:text-foreground data-selected:**:[svg]:text-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none group/command-item data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0";
const commandActionsClassName = [
  "**:[[cmd-item]]:data-selected:bg-muted",
  "**:[[cmd-item]]:data-selected:text-foreground",
  "**:[[cmd-item]]:relative",
  "**:[[cmd-item]]:flex",
  "**:[[cmd-item]]:cursor-default",
  "**:[[cmd-item]]:items-center",
  "**:[[cmd-item]]:gap-2",
  "**:[[cmd-item]]:rounded-sm",
  "**:[[cmd-item]]:px-2",
  "**:[[cmd-item]]:py-1.5",
  "**:[[cmd-item]]:text-sm",
  "**:[[cmd-item]]:outline-hidden",
  "**:[[cmd-item]]:select-none",
  "**:[[cmd-item]]:data-[disabled=true]:pointer-events-none",
  "**:[[cmd-item]]:data-[disabled=true]:opacity-50",
  "**:[[cmd-item]]:[&_svg:not([class*='size-'])]:size-4",
  "**:[[cmd-item]]:[&_svg]:pointer-events-none",
  "**:[[cmd-item]]:[&_svg]:shrink-0",
  "**:[[cmd-item]>[data-slot='shortcut']]:text-muted-foreground",
  "**:[[cmd-item]>[data-slot='shortcut']]:ml-auto",
  "**:[[cmd-item]>[data-slot='shortcut']]:text-xs",
  "**:[[cmd-item]>[data-slot='shortcut']]:tracking-widest",
].join(" ");

function usePaletteId(palette?: string) {
  const fallbackPalette = React.useId().replaceAll(":", "");
  return palette ?? `command-${fallbackPalette}`;
}

function CommandRoot({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(commandRootClassName, className)}
      {...props}
    />
  );
}

function CommandDialogRoot({
  children,
  open,
  onOpenChange,
  defaultOpen,
  className,
  overlayClassName,
  contentClassName,
  palette,
  value,
  defaultValue,
  filter,
  shouldFilter,
  loop,
  onValueChange,
  label,
}: React.ComponentProps<typeof CommandPrimitive.Dialog>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
      <DialogContent
        overlayClassName={cn(commandDialogOverlayClassName, overlayClassName)}
        className={cn(commandDialogContentClassName, contentClassName)}
        showCloseButton={false}
      >
        <CommandPrimitive
          data-slot="command-dialog"
          palette={usePaletteId(palette)}
          value={value}
          defaultValue={defaultValue}
          filter={filter}
          shouldFilter={shouldFilter}
          loop={loop}
          onValueChange={onValueChange}
          label={label}
          className={cn(commandRootClassName, className)}
        >
          {children}
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}

function CommandDialog({
  title = "Command Palette",
  description: _description = "Search for a command to run...",
  children,
  className,
  overlayClassName,
  contentClassName,
  palette,
  showCloseButton = false,
  ...props
}: Omit<React.ComponentProps<typeof CommandPrimitive.Dialog>, "children" | "label"> & {
  title?: string;
  description?: string;
  className?: string;
  palette?: string;
  showCloseButton?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange} defaultOpen={props.defaultOpen}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{_description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        overlayClassName={cn(commandDialogOverlayClassName, overlayClassName)}
        className={cn(commandDialogContentClassName, contentClassName, className)}
        showCloseButton={showCloseButton}
      >
        <CommandPrimitive
          data-slot="command-dialog"
          palette={usePaletteId(palette)}
          value={props.value}
          defaultValue={props.defaultValue}
          filter={props.filter}
          shouldFilter={props.shouldFilter}
          loop={props.loop}
          onValueChange={props.onValueChange}
          label={title}
          className={commandRootClassName}
        >
          {children}
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <InputGroup className="bg-input/30 border-input/30 h-8! rounded-lg! shadow-none! *:data-[slot=input-group-addon]:pl-2!">
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            "w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        <InputGroupAddon>
          <SearchIcon className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
        className,
      )}
      {...props}
    />
  );
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn("text-foreground **:[[cmd-group-heading]]:text-muted-foreground overflow-hidden p-1 **:[[cmd-group-heading]]:px-2 **:[[cmd-group-heading]]:py-1.5 **:[[cmd-group-heading]]:text-xs **:[[cmd-group-heading]]:font-medium", className)}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("bg-border -mx-1 h-px w-auto", className)}
      {...props}
    />
  );
}

function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(commandItemClassName, className)}
      {...props}
    >
      {children}
    </CommandPrimitive.Item>
  );
}

function CommandLoading({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Loading>) {
  return (
    <CommandPrimitive.Loading
      data-slot="command-loading"
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    />
  );
}

function CommandActions({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Actions>) {
  return (
    <CommandPrimitive.Actions
      data-slot="command-actions"
      className={cn(commandActionsClassName, className)}
      {...props}
    />
  );
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn("text-muted-foreground group-data-selected/command-item:text-foreground ml-auto text-xs tracking-widest", className)}
      {...props}
    />
  );
}

const Command = Object.assign(CommandRoot, {
  Dialog: CommandDialogRoot,
  Input: CommandInput,
  List: CommandList,
  Empty: CommandEmpty,
  Group: CommandGroup,
  Separator: CommandSeparator,
  Item: CommandItem,
  Loading: CommandLoading,
  Actions: CommandActions,
});

export {
  Command,
  type CommandAction,
  CommandActions,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandSeparator,
  CommandShortcut,
  createCommandPalette,
  useCommandActions,
  useCommandShortcutDefault,
};

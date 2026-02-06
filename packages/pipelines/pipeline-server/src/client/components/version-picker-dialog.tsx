import type { PipelineInfo } from "@ucdjs/pipelines-ui";
import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import { Checkbox } from "@ucdjs-internal/shared-ui/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ucdjs-internal/shared-ui/ui/dialog";
import { Label } from "@ucdjs-internal/shared-ui/ui/label";
import { useState } from "react";

interface VersionPickerDialogProps {
  pipeline: PipelineInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExecute: (versions: string[]) => void;
}

export function VersionPickerDialog({
  pipeline,
  open,
  onOpenChange,
  onExecute,
}: VersionPickerDialogProps) {
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(
    () => new Set(pipeline.versions),
  );

  const toggleVersion = (version: string) => {
    setSelectedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  };

  const handleExecute = () => {
    if (selectedVersions.size > 0) {
      onExecute(Array.from(selectedVersions));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>
            Execute
            {pipeline.name || pipeline.id}
          </DialogTitle>
          <DialogDescription>
            Select the versions you want to execute.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {pipeline.versions.map((version) => (
            <div key={version} className="flex items-center space-x-2">
              <Checkbox
                id={`version-${version}`}
                checked={selectedVersions.has(version)}
                onCheckedChange={() => toggleVersion(version)}
              />
              <Label
                htmlFor={`version-${version}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {version}
              </Label>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExecute}
            disabled={selectedVersions.size === 0}
          >
            Execute (
            {selectedVersions.size}
            )
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

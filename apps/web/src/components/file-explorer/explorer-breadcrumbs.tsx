import { ExplorerBreadcrumbsBase } from "#components/explorer/explorer-breadcrumbs-base";
import { Link, useMatch } from "@tanstack/react-router";
import { Button } from "@ucdjs-internal/shared-ui/components";
import { useClipboard } from "@ucdjs-internal/shared-ui/hooks";
import { Copy, CopyCheck, CopyX, FolderOpen } from "lucide-react";

export function ExplorerBreadcrumbs() {
  const match = useMatch({ from: "/(explorer)/file-explorer" });
  const path = (match?.params as { _splat?: string })?._splat || "";
  const pathSegments = path ? path.split("/").filter(Boolean) : [];
  const isRoot = pathSegments.length === 0;
  const { copy, copied, error } = useClipboard();

  function copyToClipboard() {
    copy(`/${path}`);
  }

  return (
    <ExplorerBreadcrumbsBase
      rootLabel="Files"
      rootIcon={<FolderOpen className="size-3.5 text-amber-500" />}
      isRoot={isRoot}
      rootRender={(
        <Link
          to="/file-explorer/$"
          params={{ _splat: "" }}
        />
      )}
      segments={pathSegments.map((segment, index) => {
        const segmentPath = pathSegments.slice(0, index + 1).join("/");
        const isLast = index === pathSegments.length - 1;

        return {
          key: segmentPath,
          label: segment,
          current: isLast,
          render: isLast
            ? undefined
            : (
                <Link
                  to="/file-explorer/$"
                  params={{ _splat: segmentPath }}
                />
              ),
        };
      })}
      trailing={!isRoot
        ? (
            <Button variant="ghost" type="button" onClick={copyToClipboard} title="Copy path (Mod+Shift+C)">
              {error
                ? <CopyX className="size-3 text-red-500" />
                : copied
                  ? <CopyCheck className="size-3 text-green-500" />
                  : <Copy className="size-3" />}
            </Button>
          )
        : undefined}
    />
  );
}

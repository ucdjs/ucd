import { versionDetailsQueryOptions } from "#functions/versions";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@ucdjs-internal/shared-ui/components";
import { StatBadge } from "./stat-badge";

export function VersionStatistics({ version }: { version: string }) {
  const { data: details } = useQuery(versionDetailsQueryOptions(version));

  if (!details || details.statistics.totalCharacters === 0) {
    return null;
  }

  const { statistics } = details;
  const hasNew = statistics.newCharacters > 0 || statistics.newBlocks > 0 || statistics.newScripts > 0;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground max-w-2xl">
        Unicode
        {" "}
        {version}
        {" "}
        defines
        {" "}
        <span className="font-medium text-foreground">{statistics.totalCharacters.toLocaleString()}</span>
        {" "}
        characters across
        {" "}
        <span className="font-medium text-foreground">{statistics.totalBlocks.toLocaleString()}</span>
        {" "}
        blocks and
        {" "}
        <span className="font-medium text-foreground">{statistics.totalScripts.toLocaleString()}</span>
        {" "}
        scripts.
        {hasNew && (
          <>
            {" "}
            This release adds
            {statistics.newCharacters > 0 && (
              <>
                {" "}
                <span className="font-medium text-foreground">{statistics.newCharacters.toLocaleString()}</span>
                {" "}
                new characters
              </>
            )}
            {statistics.newCharacters > 0 && statistics.newBlocks > 0 && ","}
            {statistics.newBlocks > 0 && (
              <>
                {" "}
                <span className="font-medium text-foreground">{statistics.newBlocks.toLocaleString()}</span>
                {" "}
                new blocks
              </>
            )}
            {(statistics.newCharacters > 0 || statistics.newBlocks > 0) && statistics.newScripts > 0 && ","}
            {statistics.newScripts > 0 && (
              <>
                {" "}
                and
                {" "}
                <span className="font-medium text-foreground">{statistics.newScripts.toLocaleString()}</span>
                {" "}
                new scripts
              </>
            )}
            .
          </>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <StatBadge
          label="Characters"
          value={statistics.totalCharacters}
          newValue={statistics.newCharacters}
        />
        <StatBadge
          label="Blocks"
          value={statistics.totalBlocks}
          newValue={statistics.newBlocks}
        />
        <StatBadge
          label="Scripts"
          value={statistics.totalScripts}
          newValue={statistics.newScripts}
        />
      </div>
    </div>
  );
}

export function VersionStatisticsSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {["stat-1", "stat-2", "stat-3"].map((key) => (
        <Skeleton key={key} className="h-8 w-32 rounded-md" />
      ))}
    </div>
  );
}

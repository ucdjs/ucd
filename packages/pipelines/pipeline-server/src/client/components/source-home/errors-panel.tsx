import type { SourceDetail } from "@ucdjs/pipelines-ui/schemas";
import { AlertCircle } from "lucide-react";
import { useMemo } from "react";

export function ErrorsPanel({ errors }: { errors: SourceDetail["errors"] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const err of errors) {
      const list = map.get(err.filePath) ?? [];
      list.push(err.message);
      map.set(err.filePath, list);
    }
    return map;
  }, [errors]);

  return (
    <section>
      <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
        <div className="flex items-center gap-2 text-red-700 mb-3">
          <AlertCircle className="w-4 h-4" />
          <h2 className="text-sm font-medium">
            {errors.length}
            {" "}
            loading error
            {errors.length !== 1 ? "s" : ""}
          </h2>
        </div>
        <div className="space-y-3">
          {[...grouped.entries()].map(([filePath, messages]) => (
            <div key={filePath} className="text-sm">
              <div className="font-mono text-xs text-red-800 mb-1">{filePath}</div>
              {messages.map((msg) => (
                <div key={msg} className="text-red-700/80 text-xs ml-3">
                  •
                  {" "}
                  {msg}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import type { PipelineDetails } from "../../types";
import { Badge } from "@ucdjs-internal/shared-ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ucdjs-internal/shared-ui/ui/card";

type RouteInfo = PipelineDetails["routes"][number];
type Dependency = RouteInfo["depends"][number];
type EmittedArtifact = RouteInfo["emits"][number];
type OutputConfig = RouteInfo["outputs"][number];

export interface RouteDetailsProps {
  route: RouteInfo;
}

interface DependsSectionProps {
  depends: readonly Dependency[];
}

function DependsSection({ depends }: DependsSectionProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Depends</h3>
      {depends.length === 0
        ? (
            <p className="text-sm text-muted-foreground">No dependencies.</p>
          )
        : (
            <div className="flex flex-wrap gap-2">
              {depends.map((dep, index) => (
                <Badge key={`${dep.type}-${index}`} variant="outline">
                  {dep.type === "route"
                    ? `route:${dep.routeId}`
                    : `artifact:${dep.routeId}:${dep.artifactName}`}
                </Badge>
              ))}
            </div>
          )}
    </section>
  );
}

interface EmitsSectionProps {
  emits: readonly EmittedArtifact[];
}

function EmitsSection({ emits }: EmitsSectionProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Emits</h3>
      {emits.length === 0
        ? (
            <p className="text-sm text-muted-foreground">No emitted artifacts.</p>
          )
        : (
            <div className="flex flex-wrap gap-2">
              {emits.map((emit) => (
                <Badge key={emit.id} variant="secondary">
                  {emit.id}
                  {" "}
                  <span className="text-[10px] opacity-70">{emit.scope}</span>
                </Badge>
              ))}
            </div>
          )}
    </section>
  );
}

interface OutputsSectionProps {
  outputs: readonly OutputConfig[];
}

function OutputsSection({ outputs }: OutputsSectionProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Outputs</h3>
      {outputs.length === 0
        ? (
            <p className="text-sm text-muted-foreground">No output configuration.</p>
          )
        : (
            <div className="space-y-2">
              {outputs.map((output, index) => (
                <div key={index} className="rounded-md border border-border p-3 text-sm">
                  <div className="text-muted-foreground">
                    dir:
                    {" "}
                    {output.dir ?? "default"}
                  </div>
                  <div className="text-muted-foreground">
                    file:
                    {" "}
                    {output.fileName ?? "default"}
                  </div>
                </div>
              ))}
            </div>
          )}
    </section>
  );
}

interface TransformsSectionProps {
  transforms: readonly string[];
}

function TransformsSection({ transforms }: TransformsSectionProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Transforms</h3>
      {transforms.length === 0
        ? (
            <p className="text-sm text-muted-foreground">No transforms.</p>
          )
        : (
            <div className="flex flex-wrap gap-2">
              {transforms.map((transform, index) => (
                <Badge key={`${transform}-${index}`} variant="outline">
                  {transform}
                </Badge>
              ))}
            </div>
          )}
    </section>
  );
}

export function RouteDetails({ route }: RouteDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DependsSection depends={route.depends} />
        <EmitsSection emits={route.emits} />
        <OutputsSection outputs={route.outputs} />
        <TransformsSection transforms={route.transforms} />
      </CardContent>
    </Card>
  );
}

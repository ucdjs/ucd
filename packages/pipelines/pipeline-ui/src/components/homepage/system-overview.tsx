import { FileCode, FolderGit, GitBranch, Play } from "lucide-react";
import { Card, CardContent } from "@ucdjs-internal/shared-ui/ui/card";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export interface SystemOverviewProps {
  totalSources: number;
  totalFiles: number;
  totalPipelines: number;
  totalExecutions: number;
}

export function SystemOverview({
  totalSources,
  totalFiles,
  totalPipelines,
  totalExecutions,
}: SystemOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Sources"
        value={totalSources}
        icon={<FolderGit className="w-5 h-5 text-blue-600" />}
        color="bg-blue-50"
      />
      <StatCard
        title="Files"
        value={totalFiles}
        icon={<FileCode className="w-5 h-5 text-green-600" />}
        color="bg-green-50"
      />
      <StatCard
        title="Pipelines"
        value={totalPipelines}
        icon={<GitBranch className="w-5 h-5 text-purple-600" />}
        color="bg-purple-50"
      />
      <StatCard
        title="Executions"
        value={totalExecutions}
        icon={<Play className="w-5 h-5 text-orange-600" />}
        color="bg-orange-50"
      />
    </div>
  );
}

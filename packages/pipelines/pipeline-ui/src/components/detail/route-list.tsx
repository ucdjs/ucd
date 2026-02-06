import { cn } from "#lib/utils";

export interface RouteItemProps {
  route: { id: string; cache: boolean };
  onClick?: () => void;
  className?: string;
}

export function RouteItem({
  route,
  onClick,
  className,
}: RouteItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between py-2 px-3 rounded-md transition-colors",
        onClick
          ? "hover:bg-accent cursor-pointer text-left"
          : "hover:bg-accent/30",
        className,
      )}
    >
      <code className="text-xs font-medium text-foreground">{route.id}</code>
      <div className="flex items-center gap-2">
        {route.cache && (
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            cached
          </span>
        )}
        {onClick && (
          <svg
            className="w-3.5 h-3.5 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        )}
      </div>
    </button>
  );
}

export interface RouteListProps {
  routes: Array<{ id: string; cache: boolean }>;
  onRouteClick?: (routeId: string) => void;
  className?: string;
}

export function RouteList({
  routes,
  onRouteClick,
  className,
}: RouteListProps) {
  return (
    <section className={className}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs text-muted-foreground uppercase tracking-wider">
          Routes
        </h2>
        <span className="text-xs text-muted-foreground">
          {routes.length}
        </span>
      </div>
      <div className="bg-card rounded-lg border border-border">
        {routes.map((route, index) => (
          <div
            key={route.id}
            className={cn(
              index !== routes.length - 1 && "border-b border-border"
            )}
          >
            <RouteItem
              route={route}
              onClick={onRouteClick ? () => onRouteClick(route.id) : undefined}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

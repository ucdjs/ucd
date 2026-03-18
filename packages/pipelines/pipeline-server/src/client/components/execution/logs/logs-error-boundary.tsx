import { Component } from "react";

interface LogsErrorBoundaryState {
  error: Error | null;
}

export class LogsErrorBoundary extends Component<{ children: React.ReactNode }, LogsErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): LogsErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Failed to load logs:
          {" "}
          {this.state.error.message}
        </div>
      );
    }

    return this.props.children;
  }
}

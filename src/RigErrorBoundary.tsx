import React from "react";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = { hasError: boolean; message: string };

export class RigErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Unknown 3D rig error"
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("Pegasus rig crash", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="rig-error">
          <strong>3D rig isolated safely</strong>
          <span>{this.state.message}</span>
        </div>
      );
    }
    return this.props.children;
  }
}

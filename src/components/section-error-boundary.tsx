"use client";

import React from "react";

function SectionErrorFallback({ reset }: { reset?: () => void }) {
  return (
    <div className="border border-border bg-panel px-4 py-4">
      <p className="text-sm text-muted">This section failed to load.</p>
      {reset ? (
        <button
          onClick={reset}
          className="mt-2 text-xs uppercase tracking-[0.16em] text-muted underline transition hover:text-foreground"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SectionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? <SectionErrorFallback reset={this.reset} />
      );
    }
    return this.props.children;
  }
}

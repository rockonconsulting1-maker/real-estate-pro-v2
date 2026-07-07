import React from 'react';
import { useRouteError } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export function RouteErrorBoundary() {
  const error = useRouteError() as any;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        {error?.message || 'An unexpected error occurred while loading this page.'}
      </p>
      <Button onClick={() => window.location.reload()}>
        Try Again
      </Button>
    </div>
  );
}

interface WidgetErrorBoundaryProps {
  children: React.ReactNode;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class WidgetErrorBoundary extends React.Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): WidgetErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Widget error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center border rounded-lg bg-surface min-h-[150px]">
          <AlertCircle className="h-6 w-6 text-destructive mb-2" />
          <p className="text-sm font-medium mb-1">Widget Failed to Load</p>
          <p className="text-xs text-muted-foreground mb-3 max-w-[200px] truncate">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <Button variant="outline" size="sm" onClick={() => this.setState({ hasError: false, error: undefined })}>
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

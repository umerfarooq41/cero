import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <section role="alert" className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center text-foreground">
      <AlertTriangle className="size-8 text-destructive" aria-hidden="true"/>
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">This screen could not be loaded. Retrying may discard unsaved changes.</p>
      <button type="button" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={()=>this.setState({failed:false})}>Try again</button>
      <a className="text-sm text-primary underline" href="/">Return to Dashboard</a>
    </section>;
  }
}

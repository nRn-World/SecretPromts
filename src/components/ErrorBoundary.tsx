import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last line of defence: if anything throws during a React commit the whole tree
 * would otherwise unmount and leave a blank page. Show a recoverable message
 * instead, so a third-party DOM glitch can never take the site down.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uncaught UI error:', error, info?.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-center text-zinc-100">
        <div className="w-full max-w-sm space-y-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h1 className="text-lg font-black text-white">Något gick fel</h1>
          <p className="text-xs leading-relaxed text-zinc-400">
            Something went wrong while rendering the page. Reload to continue where you left off.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-xs font-black text-white transition hover:from-purple-500 hover:to-pink-500"
          >
            Ladda om / Reload
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

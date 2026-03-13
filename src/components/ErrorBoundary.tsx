// ErrorBoundary using React's class component API
// @ts-nocheck - Class component type inference conflicts with useDefineForClassFields:false
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-rose-50 border border-rose-200 rounded-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-semibold text-rose-700 uppercase tracking-widest">
              {this.props.fallbackTitle || 'Section Error'}
            </h3>
          </div>
          <p className="text-xs text-rose-600 font-mono">
            This section failed to render. Try refreshing the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-3 text-xs text-rose-600 hover:text-rose-500 underline uppercase tracking-wider"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

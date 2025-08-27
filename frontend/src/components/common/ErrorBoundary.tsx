import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-64 p-8">
          <div className="text-center max-w-md">
            <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Что-то пошло не так
            </h2>
            <p className="text-gray-400 mb-4">
              Произошла ошибка при отображении этого компонента.
            </p>
            {this.state.error && (
              <details className="text-left bg-neutral-800 rounded p-3 mb-4">
                <summary className="cursor-pointer text-sm text-gray-300 mb-2">
                  Детали ошибки
                </summary>
                <pre className="text-xs text-red-300 overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
              Попробовать снова
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
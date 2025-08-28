import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="container-fluid py-4">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card border-danger">
                <div className="card-header bg-danger text-white">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Something went wrong
                  </h5>
                </div>
                <div className="card-body">
                  <p className="mb-3">
                    An unexpected error occurred. This has been logged for investigation.
                  </p>
                  {this.state.error && (
                    <details className="mb-3">
                      <summary className="text-muted small">Error details</summary>
                      <pre className="mt-2 p-2 bg-light rounded small text-muted">
                        {this.state.error.message}
                      </pre>
                    </details>
                  )}
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-primary"
                      onClick={() => window.location.reload()}
                    >
                      Reload Page
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => this.setState({ hasError: false, error: undefined })}
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;